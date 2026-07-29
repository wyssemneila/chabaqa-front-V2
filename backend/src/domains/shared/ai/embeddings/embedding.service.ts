import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Thin wrapper around an embeddings endpoint for the AI RAG layer.
 *
 * Strategy (free-first):
 *  - Uses the OpenAI SDK pointed at the configured provider (default OpenRouter,
 *    or Ollama Cloud when AI_PROVIDER=OLLAMA_CLOUD).
 *  - Default model is a free embedding model on OpenRouter (override via
 *    EMBEDDING_MODEL). On Ollama Cloud, defaults to a free Ollama embedding model.
 *  - Falls back gracefully: if no API key is configured or the call fails,
 *    methods return `null` so callers can keep using the existing keyword-regex
 *    retrieval path. Nothing breaks if embeddings are unavailable.
 *  - Embeddings are stored on the existing `embedding?: number[]` field of
 *    AiKnowledgeDocument; no new infra is required.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;
  private readonly maxInputChars: number;
  private readonly batchSize: number;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const aiProvider = (
      this.configService.get<string>('AI_PROVIDER') || 'OPENROUTER'
    ).toUpperCase();
    const useOllamaCloud = aiProvider === 'OLLAMA_CLOUD';

    const apiKey = useOllamaCloud
      ? this.configService.get<string>('EMBEDDING_API_KEY') ||
        this.configService.get<string>('OLLAMA_API_KEY') ||
        ''
      : this.configService.get<string>('EMBEDDING_API_KEY') ||
        this.configService.get<string>('OPENROUTER_API_KEY') ||
        '';
    const baseURL = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_BASE_URL') || 'https://ollama.com/v1'
      : this.configService.get<string>('OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1';

    this.model = useOllamaCloud
      ? this.configService.get<string>('EMBEDDING_MODEL') || 'nomic-embed-text'
      : this.configService.get<string>('EMBEDDING_MODEL') ||
        'free/text-embedding-3-small';

    this.maxInputChars = Math.min(
      Math.max(
        Number(this.configService.get<string>('EMBEDDING_MAX_INPUT_CHARS') || 4000),
        256,
      ),
      16000,
    );
    this.batchSize = Math.min(
      Math.max(Number(this.configService.get<string>('EMBEDDING_BATCH_SIZE') || 16), 1),
      64,
    );

    this.enabled = Boolean(apiKey);
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL,
          timeout: Number(
            this.configService.get<string>('EMBEDDING_TIMEOUT_MS') || 30000,
          ),
          ...(useOllamaCloud
            ? {}
            : {
                defaultHeaders: {
                  'HTTP-Referer':
                    this.configService.get<string>('OPENROUTER_SITE_URL') ||
                    this.configService.get<string>('FRONTEND_URL') ||
                    'https://chabaqa.io',
                  'X-Title':
                    this.configService.get<string>('OPENROUTER_APP_NAME') ||
                    'Chabaqa AI Embeddings',
                },
              }),
        })
      : null;

    if (!this.enabled) {
      this.logger.warn(
        'EmbeddingService disabled — no EMBEDDING_API_KEY/OPENROUTER_API_KEY set. RAG will fall back to keyword-regex retrieval.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private truncate(text: string): string {
    const trimmed = (text || '').trim();
    if (trimmed.length <= this.maxInputChars) return trimmed;
    return trimmed.slice(0, this.maxInputChars);
  }

  /**
   * Embed a single text. Returns null on any failure (so callers fall back).
   */
  async embedQuery(text: string): Promise<number[] | null> {
    if (!this.enabled || !this.client) return null;
    try {
      const res = await this.client.embeddings.create({
        model: this.model,
        input: this.truncate(text),
      });
      const vec = res.data?.[0]?.embedding;
      return Array.isArray(vec) ? (vec as number[]) : null;
    } catch (error: any) {
      this.logger.warn(
        `embedQuery failed (${this.model}): ${error?.message || error}`,
      );
      return null;
    }
  }

  /**
   * Embed a batch of texts. Returns embeddings in the SAME ORDER as inputs,
   * with `null` for any item that could not be embedded. If the whole call
   * fails, returns an array of nulls (so callers can degrade gracefully).
   */
  async embedBatch(
    texts: string[],
  ): Promise<(number[] | null)[]> {
    if (!this.enabled || !this.client || texts.length === 0) {
      return texts.map(() => null);
    }
    const results: (number[] | null)[] = new Array(texts.length).fill(null);
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const slice = texts.slice(i, i + this.batchSize);
      const truncated = slice.map((t) => this.truncate(t));
      try {
        const res = await this.client.embeddings.create({
          model: this.model,
          input: truncated,
        });
        for (const item of res.data || []) {
          const idx = i + Number(item.index);
          if (Array.isArray(item.embedding)) {
            results[idx] = item.embedding as number[];
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `embedBatch failed (${this.model}) for slice ${i}: ${error?.message || error}`,
        );
      }
    }
    return results;
  }

  /**
   * Cosine similarity between two vectors. Returns 0 if either is missing or
   * dimensions mismatch.
   */
  cosine(a: number[] | null | undefined, b: number[] | null | undefined): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      const av = a[i];
      const bv = b[i];
      dot += av * bv;
      normA += av * av;
      normB += bv * bv;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
