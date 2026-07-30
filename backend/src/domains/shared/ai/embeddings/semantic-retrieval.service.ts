import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AiKnowledgeDocument,
  AiKnowledgeDocumentDocument,
} from '@/infrastructure/database/schemas/ai/ai-knowledge-document.schema';
import { EmbeddingService } from './embedding.service';

/**
 * Shared semantic retrieval over the AiKnowledgeDocument collection.
 *
 * Flow:
 *  1. embed the query (EmbeddingService)
 *  2. load candidate docs for the community (with embeddings populated)
 *  3. rank by cosine similarity in-memory, return top-K
 *
 * Falls back to null when embeddings are unavailable so callers can use their
 * existing keyword-regex path.
 */
@Injectable()
export class SemanticRetrievalService {
  private readonly logger = new Logger(SemanticRetrievalService.name);

  constructor(
    private readonly embeddings: EmbeddingService,
    @InjectModel(AiKnowledgeDocument.name)
    private readonly knowledgeModel: Model<AiKnowledgeDocumentDocument>,
  ) {}

  isAvailable(): boolean {
    return this.embeddings.isEnabled();
  }

  /**
   * Returns the top-K knowledge docs for a community, ranked by semantic
   * similarity to `query`. Returns null if embeddings are unavailable or no
   * docs have embeddings yet — caller should fall back to keyword regex.
   */
  async retrieve(params: {
    communityId: string;
    query: string;
    limit?: number;
    visibility?: ('member' | 'public' | 'staff')[];
    minScore?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any[] | null> {
    if (!this.embeddings.isEnabled()) return null;

    const queryEmbedding = await this.embeddings.embedQuery(params.query);
    if (!queryEmbedding) return null;

    const visibility = params.visibility || ['member', 'public'];
    const limit = Math.min(Math.max(params.limit || 8, 1), 32);
    const minScore = params.minScore ?? 0.12;

    // Load candidate docs that have embeddings. Capped to a reasonable ceiling
    // to keep in-memory cosine cheap; for most communities this is well under
    // a few hundred docs.
    const candidates = await this.knowledgeModel
      .find({
        communityId: params.communityId,
        visibility: { $in: visibility },
        embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
      })
      .limit(500)
      .lean()
      .exec();

    if (candidates.length === 0) return null;

    const scored = candidates
      .map((doc) => ({
        doc,
        score: this.embeddings.cosine(queryEmbedding, (doc as any).embedding),
      }))
      .filter((entry) => entry.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((entry) => entry.doc);
  }
}
