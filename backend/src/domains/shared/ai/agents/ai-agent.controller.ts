import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiAgentService } from './ai-agent.service';
import { AiAgentChatService } from './ai-agent-chat.service';
import { AiKnowledgeIndexerService } from './ai-knowledge-indexer.service';
import {
  ChatWithAiAgentDto,
  CreateAiAgentDto,
  UpdateAiAgentDto,
} from './dto/ai-agent.dto';

@Controller('communities/:id/ai')
@UseGuards(AuthGuard('jwt'))
export class AiAgentController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly aiAgentChatService: AiAgentChatService,
    private readonly knowledgeIndexer: AiKnowledgeIndexerService,
  ) {}

  @Get('agents')
  list(@Param('id') communityId: string, @Request() req: any) {
    return this.aiAgentService.list(communityId, req.user._id);
  }

  @Post('agents')
  create(
    @Param('id') communityId: string,
    @Body() body: CreateAiAgentDto,
    @Request() req: any,
  ) {
    return this.aiAgentService.create(communityId, req.user._id, body);
  }

  @Patch('agents/:agentId')
  update(
    @Param('id') communityId: string,
    @Param('agentId') agentId: string,
    @Body() body: UpdateAiAgentDto,
    @Request() req: any,
  ) {
    return this.aiAgentService.update(communityId, agentId, req.user._id, body);
  }

  @Delete('agents/:agentId')
  remove(
    @Param('id') communityId: string,
    @Param('agentId') agentId: string,
    @Request() req: any,
  ) {
    return this.aiAgentService.remove(communityId, agentId, req.user._id);
  }

  @Post('agents/:agentId/chat')
  chat(
    @Param('id') communityId: string,
    @Param('agentId') agentId: string,
    @Body() body: ChatWithAiAgentDto,
    @Request() req: any,
  ) {
    return this.aiAgentChatService.chat(
      communityId,
      agentId,
      req.user._id,
      body.message,
      body.conversationId,
    );
  }

  @Get('agents/:agentId/conversations')
  conversations(
    @Param('id') communityId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.aiAgentChatService.conversations(communityId, agentId);
  }

  @Post('knowledge/reindex')
  reindex(@Param('id') communityId: string) {
    return this.knowledgeIndexer.reindexCommunity(communityId);
  }

  @Get('knowledge/status')
  knowledgeStatus(@Param('id') communityId: string) {
    return this.knowledgeIndexer.status(communityId);
  }
}
