import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsOriginHandler } from '@/shared/utils/security-config.util';
import { SocketAuthService } from '@/shared/services/socket-auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '@/infrastructure/database/schemas/communication/conversation.schema';

@WebSocketGateway({
  namespace: '/dm',
  cors: { origin: getCorsOriginHandler(), credentials: true },
})
export class DmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly socketAuthService: SocketAuthService,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const actor = await this.socketAuthService.authenticate(client);
      const userId = actor.id;

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        if (userSockets.size === 0) {
          this.server.emit('user:status', { userId, status: 'online' });
        }
        userSockets.add(client.id);
      }

      (client as any).userId = userId;
      (client as any).isAdmin = actor.isAdmin;
      client.data.actor = actor;
      client.join(`user:${userId}`);
    } catch (e) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId && this.onlineUsers.has(userId)) {
      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.server.emit('user:status', { userId, status: 'offline' });
          this.onlineUsers.delete(userId);
        }
      }
    }
  }

  @SubscribeMessage('dm:get-online-users')
  handleGetOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  @SubscribeMessage('dm:join')
  async handleJoinRoom(client: Socket, data: { conversationId: string }) {
    if (!data?.conversationId) return;
    const userId = String((client as any).userId || '').trim();
    if (!userId) return client.disconnect();

    const canJoin = await this.canJoinConversationRoom(
      data.conversationId,
      userId,
      { isAdmin: Boolean((client as any).isAdmin) },
    );

    if (!canJoin) {
      client.emit('dm:error', { code: 'FORBIDDEN' });
      return;
    }

    client.join(`conv:${data.conversationId}`);
  }

  emitNewMessage(conversationId: string, recipientUserId: string, message: any) {
    this.server.to(`user:${recipientUserId}`).emit('dm:message:new', { conversationId, message });
    this.server.to(`conv:${conversationId}`).emit('dm:message:new', { conversationId, message });
  }

  emitRead(conversationId: string, userId: string, readAt: Date) {
    this.server.to(`conv:${conversationId}`).emit('dm:message:read', { conversationId, userId, readAt });
  }

  emitMessageUpdated(conversationId: string, message: any) {
    this.server.to(`conv:${conversationId}`).emit('dm:message:updated', { conversationId, message });
  }

  emitMessageDeleted(conversationId: string, messageId: string, scope: 'me' | 'everyone', userId: string) {
    this.server.to(`conv:${conversationId}`).emit('dm:message:deleted', { conversationId, messageId, scope, userId });
  }

  emitReactionUpdated(conversationId: string, messageId: string, reactions: any[]) {
    this.server.to(`conv:${conversationId}`).emit('dm:message:reaction', { conversationId, messageId, reactions });
  }

  emitPinned(conversationId: string, message: any) {
    this.server.to(`conv:${conversationId}`).emit('dm:message:pinned', { conversationId, message });
  }

  emitTyping(conversationId: string, userId: string, isTyping: boolean) {
    this.server.to(`conv:${conversationId}`).emit('dm:typing', { conversationId, userId, isTyping });
  }

  private async canJoinConversationRoom(
    conversationId: string,
    userId: string,
    options?: { isAdmin?: boolean },
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) return false;

    const uid = new Types.ObjectId(userId);
    const conv = await this.conversationModel
      .findById(conversationId)
      .select('type participantA participantB')
      .lean();

    if (!conv) return false;

    const participantA = conv.participantA ? new Types.ObjectId(String(conv.participantA)) : null;
    const participantB = conv.participantB ? new Types.ObjectId(String(conv.participantB)) : null;

    if (participantA?.equals(uid) || participantB?.equals(uid)) {
      return true;
    }

    return Boolean(options?.isAdmin && conv.type === 'HELP_DM');
  }
}


