import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import OpenAI from 'openai';
import {
  AiAgent,
  AiAgentDocument,
} from '@/infrastructure/database/schemas/ai/ai-agent.schema';
import {
  AiConversation,
  AiConversationDocument,
} from '@/infrastructure/database/schemas/ai/ai-conversation.schema';
import {
  AiKnowledgeDocument,
  AiKnowledgeDocumentDocument,
} from '@/infrastructure/database/schemas/ai/ai-knowledge-document.schema';

@Injectable()
export class AiAgentChatService {
  private readonly client: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(AiAgent.name)
    private readonly aiAgentModel: Model<AiAgentDocument>,
    @InjectModel(AiConversation.name)
    private readonly conversationModel: Model<AiConversationDocument>,
    @InjectModel(AiKnowledgeDocument.name)
    private readonly knowledgeModel: Model<AiKnowledgeDocumentDocument>,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY') || '',
      baseURL:
        this.configService.get<string>('OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer':
          this.configService.get<string>('FRONTEND_URL') ||
          'https://chabaqa.io',
        'X-Title': 'Chabaqa AI Staff',
      },
    });
  }

  async chat(
    communityId: string,
    agentId: string,
    userId: string,
    message: string,
    conversationId?: string,
  ) {
    const agent = await this.aiAgentModel
      .findOne({ _id: agentId, communityId, status: 'active' })
      .lean()
      .exec();
    if (!agent) throw new NotFoundException('AI agent not found');

    const docs = await this.retrieveKnowledge(communityId, message);
    const citations = docs.map((doc) => ({
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      excerpt: doc.extractedText.slice(0, 240),
    }));
    const answer = await this.answer(agent, message, docs);

    const conversation = conversationId
      ? await this.conversationModel
          .findOne({ _id: conversationId, communityId, agentId })
          .exec()
      : await this.conversationModel.create({
          communityId: new Types.ObjectId(communityId),
          agentId: new Types.ObjectId(agentId),
          userId: new Types.ObjectId(userId),
          messages: [],
        });
    if (!conversation) throw new NotFoundException('Conversation not found');

    conversation.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date(),
    } as any);
    conversation.messages.push({
      role: 'assistant',
      content: answer,
      citations,
      createdAt: new Date(),
    } as any);
    await conversation.save();
    await this.aiAgentModel.updateOne(
      { _id: agentId },
      {
        $inc: { 'stats.conversations': 1 },
        $set: { 'stats.lastActiveAt': new Date() },
      },
    );

    return { conversationId: conversation._id, answer, citations, agentId };
  }

  async conversations(communityId: string, agentId: string) {
    return this.conversationModel
      .find({ communityId, agentId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean()
      .exec();
  }

  private async retrieveKnowledge(communityId: string, message: string) {
    const terms = message
      .split(/\s+/)
      .filter((term) => term.length > 3)
      .slice(0, 8);
    const query = terms.length
      ? {
          $or: terms.map((term) => ({
            extractedText: new RegExp(
              term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i',
            ),
          })),
        }
      : {};
    return this.knowledgeModel
      .find({
        communityId,
        visibility: { $in: ['member', 'public'] },
        ...query,
      })
      .limit(
        Number(
          this.configService.get<string>('AI_AGENT_MAX_CONTEXT_DOCS') || 8,
        ),
      )
      .lean()
      .exec();
  }

  private async answer(agent: any, message: string, docs: any[]) {
    if (!this.configService.get<string>('OPENROUTER_API_KEY')) {
      const sourceLine = docs[0]?.title
        ? ` I found this in "${docs[0].title}".`
        : '';
      return `I can help with that.${sourceLine} Review this answer before acting on it, and escalate to the creator if money, policy, or account access is involved.`;
    }
    const context = docs
      .map(
        (doc, index) =>
          `[${index + 1}] ${doc.title}\n${doc.extractedText.slice(0, 1200)}`,
      )
      .join('\n\n');
    const completion = await this.client.chat.completions.create({
      model:
        this.configService.get<string>('AI_AGENT_MODEL') ||
        'google/gemini-2.5-flash-lite',
      temperature: agent.modelSettings?.temperature ?? 0.35,
      max_tokens: agent.modelSettings?.maxTokens ?? 1200,
      messages: [
        {
          role: 'system',
          content: `You are ${agent.name}, a ${agent.type} for a Chabaqa community. Tone: ${agent.tone}. Use only the supplied community context. If unsure, say so and suggest escalation. ${agent.systemPromptOverride || ''}`,
        },
        {
          role: 'user',
          content: `Context:\n${context || 'No indexed context yet.'}\n\nQuestion:\n${message}`,
        },
      ],
    });
    return (
      completion.choices?.[0]?.message?.content?.trim() ||
      'I could not generate a helpful answer yet.'
    );
  }
}
