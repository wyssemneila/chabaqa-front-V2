import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { extname, join, relative, resolve } from 'path';
import { createReadStream, existsSync, mkdirSync, promises as fsPromises } from 'fs';
import { createHash, randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StorageUsage, StorageUsageDocument } from '@/infrastructure/database/schemas/shared/storage-usage.schema';
import { PolicyService } from '@/shared/services/policy.service';
import { MediaAsset, MediaAssetDocument } from '@/infrastructure/database/schemas/content/media-asset.schema';
import {
  MediaAssetStatus,
  MediaPurpose,
  MediaType,
  MediaVisibility,
  PURPOSE_DEFAULT_VISIBILITY,
} from '@/domains/content/media/media.types';
import { ensureUploadDirectories, getConfiguredUploadPath, resolveUploadsRoot } from '@/domains/shared/upload/upload-paths';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  getAllowedUploadCategory,
  isAllowedUploadMime,
  validateUploadSignature,
} from '@/domains/shared/upload/upload-security.policy';
import { MalwareScannerService, MalwareScanResult } from '@/shared/services/malware-scanner.service';
import { S3StorageAdapter } from '@/domains/content/media/storage/s3-storage.adapter';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

export interface UploadResult {
  assetId?: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  type: FileType;
}

export interface UploadContext {
  userId?: string;
  purpose?: MediaPurpose;
  entityType?: string;
  entityId?: string;
  visibility?: MediaVisibility;
}

@Injectable()
export class UploadService {
  private readonly uploadPath = getConfiguredUploadPath();
  private readonly uploadsRoot = resolveUploadsRoot();
  private readonly baseUrl = (process.env.MEDIA_PUBLIC_BASE_URL || process.env.SERVER_URL || 'https://api.chabaqa.io').replace(/\/+$/, '');
  private readonly mirrorToS3 = process.env.MEDIA_STORAGE_MIRROR_S3 === 'true' || process.env.MEDIA_STORAGE_DRIVER === 's3';
  private readonly requireS3Mirror = process.env.MEDIA_STORAGE_REQUIRE_S3 === 'true';
  private readonly storageUsageMap = new Map<string, number>(); // legacy in-memory (fallback)

  // Configuration des types de fichiers autorisés
  private readonly allowedTypes = {
    [FileType.IMAGE]: ALLOWED_UPLOAD_EXTENSIONS.image,
    [FileType.VIDEO]: ALLOWED_UPLOAD_EXTENSIONS.video,
    [FileType.DOCUMENT]: [
      ...ALLOWED_UPLOAD_EXTENSIONS.document,
    ],
    [FileType.AUDIO]: ALLOWED_UPLOAD_EXTENSIONS.audio
  };

  // Taille maximale par type (en bytes)
  private readonly maxSizes = {
    [FileType.IMAGE]: 5 * 1024 * 1024, // 5MB
    [FileType.VIDEO]: 500 * 1024 * 1024, // 500MB
    [FileType.DOCUMENT]: 100 * 1024 * 1024, // 100MB
    [FileType.AUDIO]: 20 * 1024 * 1024 // 20MB
  };

  constructor(
    @InjectModel(StorageUsage.name) private storageModel: Model<StorageUsageDocument>,
    @InjectModel(MediaAsset.name) private mediaAssetModel: Model<MediaAssetDocument>,
    private readonly policyService: PolicyService,
    private readonly malwareScanner: MalwareScannerService,
    private readonly s3StorageAdapter: S3StorageAdapter,
  ) {
    this.ensureUploadDirectories();
  }

  /**
   * Créer les dossiers d'upload s'ils n'existent pas
   */
  private ensureUploadDirectories(): void {
    ensureUploadDirectories();
  }

  /**
   * Déterminer le type de fichier basé sur l'extension
   */
  getFileType(filename: string): FileType {
    const category = getAllowedUploadCategory(filename);
    if (category) return category as FileType;
    const extension = extname(filename).toLowerCase();

    throw new BadRequestException(`Type de fichier non supporté: ${extension}`);
  }

  /**
   * Valider un fichier avant upload
   */
  validateFile(file: Express.Multer.File): FileType {
    const fileType = this.getFileType(file.originalname);

    // Vérifier la taille
    if (file.size > this.maxSizes[fileType]) {
      const maxSizeMB = this.maxSizes[fileType] / (1024 * 1024);
      throw new BadRequestException(
        `Fichier trop volumineux. Taille maximale pour ${fileType}: ${maxSizeMB}MB`
      );
    }

    // Vérifier le mimetype selon le type de fichier
    const validMimeTypes = {
      'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'video': ['video/mp4', 'video/quicktime', 'video/webm'],
      'document': [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'application/rtf',
        'application/vnd.oasis.opendocument',
        'text/plain',
        'text/csv',
        'application/csv',
      ],
      'audio': ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/flac']
    };

    const allowedMimeTypes = validMimeTypes[fileType] || [];
    const isValidMimeType = allowedMimeTypes.some(mimePrefix =>
      file.mimetype.startsWith(mimePrefix) || file.mimetype === mimePrefix
    );

    if (!isValidMimeType || !isAllowedUploadMime(fileType, file.mimetype)) {
      console.error(`❌ Type MIME rejeté: ${file.mimetype} pour le type ${fileType}`);
      console.error(`   Types acceptés: ${allowedMimeTypes.join(', ')}`);
      throw new BadRequestException(`Type MIME invalide pour ${fileType}. Types acceptés: ${allowedMimeTypes.join(', ')}`);
    }

    return fileType;
  }

  private async readUploadedHeader(file: Express.Multer.File): Promise<Buffer> {
    const maxBytes = 4100;
    if (file.buffer?.length) {
      return file.buffer.subarray(0, maxBytes);
    }
    if (!file.path || !existsSync(file.path)) {
      throw new BadRequestException('Impossible de valider le contenu du fichier');
    }

    const handle = await fsPromises.open(file.path, 'r');
    try {
      const buffer = Buffer.alloc(maxBytes);
      const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  private async assertFileSignature(file: Express.Multer.File, fileType: FileType): Promise<void> {
    const header = await this.readUploadedHeader(file);
    const reason = validateUploadSignature(file.originalname, fileType, header);
    if (reason) {
      throw new BadRequestException(`Contenu de fichier invalide: ${reason}`);
    }
  }

  private async assertMalwareScan(file: Express.Multer.File, fileType: FileType): Promise<MalwareScanResult> {
    if (!file.path) {
      return { status: 'unavailable', engine: 'local', error: 'file_path_missing' };
    }

    const result = await this.malwareScanner.scanFile(file.path);
    if (result.status === 'infected') {
      await this.malwareScanner.quarantineFile(file.path, result.signature || 'malware');
    } else if (result.status === 'unavailable' && this.malwareScanner.getMode() === 'required') {
      await this.malwareScanner.quarantineFile(file.path, 'scanner_unavailable');
    }

    this.malwareScanner.enforceScanResult(result);
    return result;
  }

  // Track and enforce storage quotas (DB-backed)
  private async getUsageBytes(userId: string): Promise<number> {
    const doc = await this.storageModel.findOne({ userId: new Types.ObjectId(userId) });
    return doc?.usedBytes || 0;
  }

  private async addUsageBytes(userId: string, bytes: number): Promise<void> {
    await this.storageModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $inc: { usedBytes: bytes } },
      { upsert: true }
    );
  }

  /**
   * Générer un nom de fichier unique
   */
  generateFilename(originalName: string): string {
    const extension = extname(originalName);
    const uuid = randomUUID();
    const timestamp = Date.now();
    return `${timestamp}-${uuid}${extension}`;
  }

  /**
   * Obtenir le chemin de destination pour un type de fichier
   */
  getDestinationPath(fileType: FileType): string {
    return join(this.uploadsRoot, fileType);
  }

  /**
   * Générer l'URL publique du fichier
   */
  generateFileUrl(filename: string, fileType: FileType): string {
    return `${this.baseUrl}/uploads/${fileType}/${filename}`;
  }

  /**
   * S'assurer qu'une URL est absolue en utilisant la baseUrl de production (api.chabaqa.io)
   * Cette méthode transforme TOUTES les URLs d'upload pour pointer vers api.chabaqa.io
   * même en développement local, garantissant une cohérence totale.
   */
  ensureAbsoluteUrl(url: string | any): string {
    if (!url || typeof url !== 'string') return url;

    const originalUrl = url;
    let result = url;

    // Si l'URL est déjà absolue (starts with http)
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        
        // Si l'URL pointe déjà vers api.chabaqa.io, on la garde telle quelle
        if (urlObj.hostname === 'api.chabaqa.io') {
          return url;
        }
        
        // Pour toute autre URL (localhost, 127.0.0.1, IP locale, etc.)
        // on transforme vers api.chabaqa.io si c'est un chemin /uploads/
        if (urlObj.pathname.includes('/uploads/')) {
          result = `${this.baseUrl}${urlObj.pathname}${urlObj.search || ''}`;
        }
      } catch (e) {
        // En cas d'URL malformée, on retourne l'original
        console.warn(`[UploadService] Invalid URL format: ${url}`);
      }
    } else if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      // Si c'est un chemin relatif commençant par /uploads ou uploads
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      result = `${this.baseUrl}${cleanPath}`;
    }

    if (originalUrl !== result) {
      console.log(`[UploadService] 🔄 URL transformed: ${originalUrl} -> ${result}`);
    }
    return result;
  }

  /**
   * Traiter un fichier uploadé
   */
  async processUploadedFile(file: Express.Multer.File, filename: string, context?: UploadContext): Promise<UploadResult> {
    let usageAdded = false;
    try {
      const fileType = this.validateFile(file);
      await this.assertFileSignature(file, fileType);
      const scanResult = await this.assertMalwareScan(file, fileType);
      if (context?.userId) {
        const limits = await this.policyService.getEffectiveLimitsForCreator(context.userId);
        const used = await this.getUsageBytes(context.userId);
        const limitBytes = limits.storageGB * 1024 * 1024 * 1024;
        if (used + file.size > limitBytes) {
          throw new ForbiddenException('Quota de stockage atteint pour votre plan.');
        }
        await this.addUsageBytes(context.userId, file.size);
        usageAdded = true;
      }
      const url = this.generateFileUrl(filename, fileType);
      const mediaRecord = await this.registerMediaAsset(file, filename, fileType, url, context, scanResult);
      await this.mirrorFileToObjectStorage(file, mediaRecord.storageKey);

      return {
        assetId: mediaRecord.assetId,
        filename,
        originalName: file.originalname,
        path: file.path,
        url: mediaRecord.url,
        size: file.size,
        mimetype: file.mimetype,
        type: fileType
      };
    } catch (error) {
      // Multer writes first, then service-level validation/quota checks happen.
      // Remove the persisted file on any failure to avoid orphan uploads.
      await this.safeRemoveUploadedFile(file?.path);
      if (usageAdded && context?.userId) {
        await this.addUsageBytes(context.userId, -file.size);
      }
      throw error;
    }
  }

  private async safeRemoveUploadedFile(filePath?: string): Promise<void> {
    if (!filePath) return;
    try {
      await fsPromises.unlink(filePath);
    } catch {
      // Best effort cleanup only.
    }
  }

  private async mirrorFileToObjectStorage(file: Express.Multer.File, storageKey: string): Promise<void> {
    if (!this.mirrorToS3 || !file?.path) return;
    try {
      await this.s3StorageAdapter.putFile(storageKey, file.path, file.mimetype);
    } catch (error) {
      console.error(`[UploadService] Failed to mirror upload to object storage: ${storageKey}`, error);
      if (this.requireS3Mirror) {
        throw error;
      }
    }
  }

  private getMediaVisibility(context?: UploadContext): MediaVisibility {
    if (context?.visibility) return context.visibility;
    if (!context?.purpose) return MediaVisibility.PUBLIC;
    return PURPOSE_DEFAULT_VISIBILITY[context.purpose] || MediaVisibility.PUBLIC;
  }

  private toObjectId(value?: string): Types.ObjectId | undefined {
    if (!value || !Types.ObjectId.isValid(value)) return undefined;
    return new Types.ObjectId(value);
  }

  private async computeChecksum(filePath?: string): Promise<string | undefined> {
    if (!filePath || !existsSync(filePath)) return undefined;
    return new Promise((resolveChecksum) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolveChecksum(hash.digest('hex')));
      stream.on('error', () => resolveChecksum(undefined));
    });
  }

  private async registerMediaAsset(
    file: Express.Multer.File,
    filename: string,
    fileType: FileType,
    publicUrl: string,
    context?: UploadContext,
    scanResult?: MalwareScanResult,
  ): Promise<{ assetId: string; url: string; storageKey: string }> {
    const uploadsRoot = resolve(join(process.cwd(), this.uploadPath));
    const filePath = resolve(file.path || join(this.getDestinationPath(fileType), filename));
    const storageKey = filePath.startsWith(uploadsRoot)
      ? relative(uploadsRoot, filePath).split('\\').join('/')
      : `${fileType}/${filename}`;

    const visibility = this.getMediaVisibility(context);
    const checksum = await this.computeChecksum(file.path);

    const created = await this.mediaAssetModel.create({
      mediaType: fileType as unknown as MediaType,
      purpose: context?.purpose || MediaPurpose.GENERIC,
      visibility,
      status: MediaAssetStatus.UPLOADED,
      filename,
      originalName: file.originalname,
      storageKey,
      url: publicUrl,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
      malwareScan: scanResult,
      uploadedBy: this.toObjectId(context?.userId),
      entityType: context?.entityType,
      entityId: context?.entityId,
    });

    if (visibility === MediaVisibility.PRIVATE && process.env.MEDIA_PRIVATE_ENFORCEMENT === 'true') {
      created.url = `${this.baseUrl}/api/media/${created._id}/access`;
      await created.save();
    }

    return {
      assetId: String(created._id),
      url: created.url,
      storageKey,
    };
  }

  /**
   * Obtenir la configuration multer pour un type de fichier (méthode utilitaire)
   * Cette méthode n'est plus utilisée directement par le module mais peut être utile pour des cas spéciaux
   */
  getMulterOptions(fileType?: FileType) {
    const multer = require('multer');
    return {
      storage: multer.diskStorage({
        destination: (req: any, file: Express.Multer.File, cb: Function) => {
          const detectedType = fileType || this.getFileType(file.originalname);
          const destinationPath = this.getDestinationPath(detectedType);
          cb(null, destinationPath);
        },
        filename: (req: any, file: Express.Multer.File, cb: Function) => {
          const uniqueName = this.generateFilename(file.originalname);
          cb(null, uniqueName);
        }
      }),
      fileFilter: (req: any, file: Express.Multer.File, cb: Function) => {
        try {
          this.validateFile(file);
          cb(null, true);
        } catch (error) {
          cb(error, false);
        }
      },
      limits: {
        fileSize: Math.max(...Object.values(this.maxSizes))
      }
    };
  }

  /**
   * Supprimer un fichier uploadé
   */
  async deleteFile(filename: string, fileType: FileType, requesterId: string): Promise<boolean> {
    try {
      const storageKey = `${fileType}/${filename}`.replace(/\\/g, '/');
      const mediaAsset = await this.mediaAssetModel.findOne({
        $or: [{ storageKey }, { filename }],
        status: { $ne: MediaAssetStatus.DELETED },
      });
      if (!mediaAsset) return false;
      if (!mediaAsset.uploadedBy || String(mediaAsset.uploadedBy) !== String(requesterId || '')) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres fichiers');
      }

      const fs = require('fs').promises;
      const filePath = join(this.getDestinationPath(fileType), filename);

      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
      mediaAsset.status = MediaAssetStatus.DELETED;
      mediaAsset.deletedAt = new Date();
      await mediaAsset.save();
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }

  /**
   * Obtenir les informations d'un fichier
   */
  getFileInfo(filename: string, fileType: FileType): UploadResult | null {
    const filePath = join(this.getDestinationPath(fileType), filename);

    if (!existsSync(filePath)) {
      return null;
    }

    const fs = require('fs');
    const stats = fs.statSync(filePath);

    return {
      filename,
      originalName: filename,
      path: filePath,
      url: this.generateFileUrl(filename, fileType),
      size: stats.size,
      mimetype: this.getMimeType(filename),
      type: fileType
    };
  }

  /**
   * Upload d'une image encodée en base64 (utile pour les avatars générés côté client)
   */
  async uploadBase64Image(
    base64Data: string,
    options?: {
      userId?: string;
      folder?: string;
      purpose?: MediaPurpose;
      entityType?: string;
      entityId?: string;
      visibility?: MediaVisibility;
    }
  ): Promise<UploadResult> {
    if (!base64Data) {
      throw new BadRequestException('Aucune image fournie');
    }

    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Format base64 invalide');
    }

    const mimeType = matches[1];
    const encodedData = matches[2];
    const extension = this.getExtensionFromMime(mimeType);

    if (!extension) {
      throw new BadRequestException(`Type d'image non supporté: ${mimeType}`);
    }

    if (!this.allowedTypes[FileType.IMAGE].includes(extension) || !isAllowedUploadMime('image', mimeType)) {
      throw new BadRequestException(`Extension non autorisée: ${extension}`);
    }

    const buffer = Buffer.from(encodedData, 'base64');
    const signatureError = validateUploadSignature(`upload${extension}`, 'image', buffer);
    if (signatureError) {
      throw new BadRequestException(`Contenu de fichier invalide: ${signatureError}`);
    }

    if (buffer.length > this.maxSizes[FileType.IMAGE]) {
      const maxSizeMB = this.maxSizes[FileType.IMAGE] / (1024 * 1024);
      throw new BadRequestException(`Image trop volumineuse. Taille maximale: ${maxSizeMB}MB`);
    }

    if (options?.userId) {
      const limits = await this.policyService.getEffectiveLimitsForCreator(options.userId);
      const used = await this.getUsageBytes(options.userId);
      const limitBytes = limits.storageGB * 1024 * 1024 * 1024;
      if (used + buffer.length > limitBytes) {
        throw new ForbiddenException('Quota de stockage atteint pour votre plan.');
      }
    }

    const filename = this.generateFilename(`upload${extension}`);
    const rootDestination = this.getDestinationPath(FileType.IMAGE);
    const targetDirectory = options?.folder ? join(rootDestination, options.folder) : rootDestination;

    if (!existsSync(targetDirectory)) {
      mkdirSync(targetDirectory, { recursive: true });
    }

    const filePath = join(targetDirectory, filename);
    await fsPromises.writeFile(filePath, buffer);

    const relativePath = options?.folder
      ? `${options.folder}/${filename}`
      : filename;
    const url = `${this.baseUrl}/uploads/${FileType.IMAGE}/${relativePath}`;
    const pseudoMulterFile = {
      originalname: filename,
      filename,
      mimetype: mimeType,
      size: buffer.length,
      path: filePath,
    } as Express.Multer.File;
    const scanResult = await this.malwareScanner.scanFile(filePath);
    if (scanResult.status === 'infected') {
      await this.malwareScanner.quarantineFile(filePath, scanResult.signature || 'malware');
      throw new BadRequestException('Uploaded image failed malware scanning');
    } else if (scanResult.status === 'unavailable' && this.malwareScanner.getMode() === 'required') {
      await this.malwareScanner.quarantineFile(filePath, 'scanner_unavailable');
    }
    this.malwareScanner.enforceScanResult(scanResult);

    const mediaRecord = await this.registerMediaAsset(
      pseudoMulterFile,
      filename,
      FileType.IMAGE,
      url,
      {
        userId: options?.userId,
        purpose: options?.purpose,
        entityType: options?.entityType,
        entityId: options?.entityId,
        visibility: options?.visibility,
      },
      scanResult,
    );

    // Base64 image uploads do not pass through Multer's normal upload flow.
    // Mirror them explicitly so every persistent upload is available in S3.
    await this.mirrorFileToObjectStorage(pseudoMulterFile, mediaRecord.storageKey);

    if (options?.userId) {
      await this.addUsageBytes(options.userId, buffer.length);
    }

    return {
      assetId: mediaRecord.assetId,
      filename,
      originalName: filename,
      path: filePath,
      url: mediaRecord.url,
      size: buffer.length,
      mimetype: mimeType,
      type: FileType.IMAGE,
    };
  }

  /**
   * Obtenir le mimetype d'un fichier basé sur son extension
   */
  private getMimeType(filename: string): string {
    const extension = extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private getExtensionFromMime(mimeType: string): string | null {
    const normalized = mimeType.toLowerCase();
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return map[normalized] || null;
  }
}
