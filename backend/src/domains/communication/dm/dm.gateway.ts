import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { getCorsOriginHandler } from '@/shared/utils/security-config.util';
import { SocketActor, SocketAuthService } from '@/shared/services/socket-auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '@/infrastructure/database/schemas/communication/conversation.schema';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';

@WebSocketGateway({
  namespace: '/dm',
  cors: { origin: getCorsOriginHandler(), credentials: true },
})
export class DmGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DmGateway.name);
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly socketAuthService: SocketAuthService,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
  ) {}

  afterInit(server: Server) {
    // Namespace middleware completes authentication before Socket.IO exposes
    // any `dm:*` event handlers. Without this, a queued `dm:join` can race
    // the asynchronous authentication in handleConnection and be rejected.
    server.use(async (client, next) => {
      try {
        const actor = await this.socketAuthService.authenticate(client);
        client.data.actor = actor;
        client.data.userId = actor.id;
        client.data.isAdmin = actor.isAdmin;
        next();
      } catch {
        // Handshake errors deliberately contain no token or verification
        // details. The client maps this code to a re-authentication state.
        const error: Error & { data?: { code: string } } = new Error('Unauthorized');
        error.data = { code: 'UNAUTHORIZED' };
        next(error);
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const actor = client.data.actor as SocketActor | undefined;
      const userId = String(actor?.id || '').trim();
      if (!actor || !userId) {
        throw new Error('Missing authenticated socket actor');
      }

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        const becameOnline = userSockets.size === 0;
        userSockets.add(client.id);

        (client as any).userId = userId;
        (client as any).isAdmin = actor.isAdmin;
        client.join(`user:${userId}`);

        if (becameOnline) {
          await this.notifyPresenceObservers(userId, 'online');
        }
      }
    } catch (error) {
      this.logger.warn('Rejected DM socket connection without an authenticated actor');
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId && this.onlineUsers.has(userId)) {
      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.onlineUsers.delete(userId);
          await this.notifyPresenceObservers(userId, 'offline');
        }
      }
    }
  }

  @SubscribeMessage('dm:get-online-users')
  async handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { userIds?: unknown[] },
  ) {
    const userId = String((client as any).userId || '').trim();
    const requestedIds = [...new Set(
      (Array.isArray(data?.userIds) ? data.userIds : [])
        .map((value) => String(value || '').trim())
        .filter((value) => Types.ObjectId.isValid(value)),
    )].slice(0, 200);
    if (!userId || requestedIds.length === 0) return [];

    const visiblePeerIds = await this.getVisiblePeerIds(userId);
    return requestedIds.filter((id) => visiblePeerIds.has(id) && this.onlineUsers.has(id));
  }

  @SubscribeMessage('dm:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const userId = String((client as any).userId || '').trim();
    if (!userId) {
      client.emit('dm:error', { code: 'UNAUTHORIZED' });
      return;
    }

    const canJoin = await this.canJoinConversationRoom(data.conversationId, userId);

    if (!canJoin) {
      client.emit('dm:error', { code: 'FORBIDDEN' });
      return;
    }

    client.join(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('dm:leave')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    if (!data?.conversationId) return;
    client.leave(`conv:${data.conversationId}`);
  }

  emitNewMessage(conversationId: string, recipientUserId: string, message: any) {
    // Socket.IO chains rooms as a union, so a recipient who is both in their
    // user room and the open conversation room receives this only once.
    this.server
      .to(`user:${recipientUserId}`)
      .to(`conv:${conversationId}`)
      .emit('dm:message:new', { conversationId, message });
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
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) return false;

    const uid = new Types.ObjectId(userId);
    const conv = await this.conversationModel
      .findById(conversationId)
      .select('type participantA participantB communityId')
      .lean();

    if (!conv) return false;

    const participantA = conv.participantA ? new Types.ObjectId(String(conv.participantA)) : null;
    const participantB = conv.participantB ? new Types.ObjectId(String(conv.participantB)) : null;

    if (!participantA?.equals(uid) && !participantB?.equals(uid)) {
      return false;
    }

    if ((conv.type === 'COMMUNITY_DM' || conv.type === 'PEER_DM') && conv.communityId) {
      const community = await this.communityModel.findById(conv.communityId).select('members').exec();
      return Boolean(community?.isMember(uid));
    }

    return true;
  }

  private async getVisiblePeerIds(userId: string): Promise<Set<string>> {
    if (!Types.ObjectId.isValid(userId)) return new Set();

    const uid = new Types.ObjectId(userId);
    const conversations = await this.conversationModel
      .find({ $or: [{ participantA: uid }, { participantB: uid }] })
      .select('type participantA participantB communityId')
      .lean();

    const communityIds = conversations
      .filter((conversation) => (conversation.type === 'COMMUNITY_DM' || conversation.type === 'PEER_DM') && conversation.communityId)
      .map((conversation) => conversation.communityId as Types.ObjectId);
    const communities = communityIds.length
      ? await this.communityModel.find({ _id: { $in: communityIds } }).select('members').exec()
      : [];
    const communityById = new Map(communities.map((community) => [String(community._id), community]));

    const peers = new Set<string>();
    for (const conversation of conversations) {
      if ((conversation.type === 'COMMUNITY_DM' || conversation.type === 'PEER_DM') && conversation.communityId) {
        const community = communityById.get(String(conversation.communityId));
        if (!community?.isMember(uid)) continue;
      }

      const participantA = String(conversation.participantA || '');
      const participantB = String(conversation.participantB || '');
      const peerId = participantA === userId ? participantB : participantA;
      if (Types.ObjectId.isValid(peerId) && peerId !== userId) peers.add(peerId);
    }

    return peers;
  }

  private async notifyPresenceObservers(userId: string, status: 'online' | 'offline') {
    try {
      const observers = await this.getVisiblePeerIds(userId);
      for (const observerId of observers) {
        this.server.to(`user:${observerId}`).emit('user:status', { userId, status });
      }
    } catch {
      // Presence must never make an otherwise valid DM connection fail.
      this.logger.warn('Unable to notify DM presence observers');
    }
  }
}
