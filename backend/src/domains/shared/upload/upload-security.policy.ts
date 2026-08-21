export type UploadFileCategory = 'image' | 'video' | 'document' | 'audio';

export const ALLOWED_UPLOAD_EXTENSIONS: Record<UploadFileCategory, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  video: ['.mp4', '.mov', '.webm'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.ppt', '.pptx', '.xls', '.xlsx', '.csv'],
  audio: ['.mp3', '.wav', '.ogg', '.aac', '.flac'],
};

export const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  '.svg',
  '.html',
  '.htm',
  '.xhtml',
  '.xml',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.php',
  '.py',
  '.rb',
  '.pl',
  '.sh',
  '.bash',
  '.bat',
  '.cmd',
  '.ps1',
  '.exe',
  '.dll',
  '.msi',
  '.jar',
  '.war',
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.bz2',
  '.xz',
  '.iso',
  '.fig',
  '.sketch',
  '.xd',
  '.ai',
  '.psd',
  '.epub',
  '.mobi',
  '.java',
  '.cpp',
  '.c',
]);

const ALLOWED_MIME_TYPES: Record<UploadFileCategory, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/rtf',
    'text/rtf',
    'application/vnd.oasis.opendocument.text',
    'text/plain',
    'text/csv',
    'application/csv',
  ],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
};

function startsWith(bytes: Buffer, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

function asciiAt(bytes: Buffer, offset: number, value: string): boolean {
  return bytes.length >= offset + value.length && bytes.subarray(offset, offset + value.length).toString('ascii') === value;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

export function getAllowedUploadCategory(filename: string): UploadFileCategory | null {
  const extension = extensionOf(filename);
  if (!extension || BLOCKED_UPLOAD_EXTENSIONS.has(extension)) return null;

  for (const [category, extensions] of Object.entries(ALLOWED_UPLOAD_EXTENSIONS)) {
    if (extensions.includes(extension)) return category as UploadFileCategory;
  }

  return null;
}

export function isAllowedUploadMime(category: UploadFileCategory, mimeType: string): boolean {
  const normalized = (mimeType || '').toLowerCase();
  return ALLOWED_MIME_TYPES[category].includes(normalized);
}

export function hasActiveContentMarkers(bytes: Buffer): boolean {
  const sample = bytes.subarray(0, 4096).toString('utf8').toLowerCase();
  return [
    '<script',
    '</script',
    '<!doctype html',
    '<html',
    '<svg',
    '<iframe',
    '<object',
    '<embed',
    '<form',
    '<?php',
    '<%@',
    'javascript:',
    'vbscript:',
    'data:text/html',
    'onerror=',
    'onload=',
    'onclick=',
  ].some((marker) => sample.includes(marker));
}

export function validateUploadSignature(filename: string, category: UploadFileCategory, bytes: Buffer): string | null {
  const extension = extensionOf(filename);
  if (bytes.length === 0) return 'Empty files are not allowed';
  if (hasActiveContentMarkers(bytes)) return 'Active HTML, SVG, script, or event-handler content is not allowed';

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return startsWith(bytes, [0xff, 0xd8, 0xff]) ? null : 'JPEG signature mismatch';
    case '.png':
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? null : 'PNG signature mismatch';
    case '.gif':
      return asciiAt(bytes, 0, 'GIF87a') || asciiAt(bytes, 0, 'GIF89a') ? null : 'GIF signature mismatch';
    case '.webp':
      return asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP') ? null : 'WebP signature mismatch';
    case '.pdf':
      return asciiAt(bytes, 0, '%PDF-') ? null : 'PDF signature mismatch';
    case '.doc':
    case '.xls':
    case '.ppt':
      return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
        ? null
        : 'Legacy Office signature mismatch';
    case '.docx':
    case '.xlsx':
    case '.pptx':
    case '.odt':
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
        startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
        startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
        ? null
        : 'Office/OpenDocument ZIP container signature mismatch';
    case '.rtf':
      return asciiAt(bytes, 0, '{\\rtf') ? null : 'RTF signature mismatch';
    case '.txt':
    case '.csv':
      return category === 'document' ? null : 'Text files are only allowed as documents';
    case '.mp4':
    case '.mov':
      return asciiAt(bytes, 4, 'ftyp') ? null : 'MP4/MOV signature mismatch';
    case '.webm':
      return startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]) ? null : 'WebM signature mismatch';
    case '.mp3':
      return asciiAt(bytes, 0, 'ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ? null : 'MP3 signature mismatch';
    case '.wav':
      return asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WAVE') ? null : 'WAV signature mismatch';
    case '.ogg':
      return asciiAt(bytes, 0, 'OggS') ? null : 'OGG signature mismatch';
    case '.aac':
      return bytes[0] === 0xff && (bytes[1] === 0xf1 || bytes[1] === 0xf9) ? null : 'AAC signature mismatch';
    case '.flac':
      return asciiAt(bytes, 0, 'fLaC') ? null : 'FLAC signature mismatch';
    default:
      return 'Unsupported file extension';
  }
}
