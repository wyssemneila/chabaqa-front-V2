import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsOriginHandler } from '@/shared/utils/security-config.util';
import { SocketAuthService } from '@/shared/services/socket-auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '@/infrastructure/database/schemas/communication/conversation.schema';

@WebSocketGateway({
  namespace: '/live-support',
  cors: { origin: getCorsOriginHandler(), credentials: true },
})
export class LiveSupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketAuthService: SocketAuthService,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const actor = await this.socketAuthService.authenticate(client);
      const actorId = actor.id;
      if (!actorId) {
        client.disconnect();
        return;
      }

      const isAdmin = actor.isAdmin;

      (client as any).actorId = actorId;
      (client as any).isAdmin = isAdmin;
      client.data.actor = actor;

      if (isAdmin) {
        client.join('support:admins');
        client.join(`support:admin:${actorId}`);
      } else {
        client.join(`support:user:${actorId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(_client: Socket) {}

  @SubscribeMessage('support:join-ticket')
  async handleJoinTicket(@ConnectedSocket() client: Socket, payload: { conversationId: string }) {
    if (!payload?.conversationId) return;
    const actorId = String((client as any).actorId || '').trim();
    if (!actorId) return client.disconnect();

    const canJoin = await this.canJoinTicketRoom(
      actorId,
      payload.conversationId,
      { isAdmin: Boolean((client as any).isAdmin) },
    );

    if (!canJoin) {
      client.emit('support:error', { code: 'FORBIDDEN' });
      return;
    }

    client.join(`support:ticket:${payload.conversationId}`);
  }

  emitTicketCreated(ticket: any) {
    const userId = String(ticket?.participantA || '');
    this.server.to('support:admins').emit('support:ticket:created', { ticket });
    if (userId) {
      this.server.to(`support:user:${userId}`).emit('support:ticket:created', { ticket });
    }
  }

  emitTicketUpdated(ticket: any) {
    const ticketId = String(ticket?._id || ticket?.id || '');
    const userId = String(ticket?.participantA || '');
    this.server.to('support:admins').emit('support:ticket:updated', { ticket });
    if (ticketId) this.server.to(`support:ticket:${ticketId}`).emit('support:ticket:updated', { ticket });
    if (userId) this.server.to(`support:user:${userId}`).emit('support:ticket:updated', { ticket });
  }

  emitTicketClaimed(ticket: any) {
    const ticketId = String(ticket?._id || ticket?.id || '');
    const userId = String(ticket?.participantA || '');
    this.server.to('support:admins').emit('support:ticket:claimed', { ticket });
    if (ticketId) this.server.to(`support:ticket:${ticketId}`).emit('support:ticket:claimed', { ticket });
    if (userId) this.server.to(`support:user:${userId}`).emit('support:ticket:claimed', { ticket });
  }

  emitTicketClosed(ticket: any) {
    const ticketId = String(ticket?._id || ticket?.id || '');
    const userId = String(ticket?.participantA || '');
    this.server.to('support:admins').emit('support:ticket:closed', { ticket });
    if (ticketId) this.server.to(`support:ticket:${ticketId}`).emit('support:ticket:closed', { ticket });
    if (userId) this.server.to(`support:user:${userId}`).emit('support:ticket:closed', { ticket });
  }

  emitMessage(ticketId: string, message: any, participantA: string) {
    this.server.to('support:admins').emit('support:message:new', { conversationId: ticketId, message });
    this.server.to(`support:ticket:${ticketId}`).emit('support:message:new', { conversationId: ticketId, message });
    if (participantA) {
      this.server.to(`support:user:${participantA}`).emit('support:message:new', { conversationId: ticketId, message });
    }
  }

  private async canJoinTicketRoom(
    actorId: string,
    conversationId: string,
    options?: { isAdmin?: boolean },
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(actorId) || !Types.ObjectId.isValid(conversationId)) return false;

    const aid = new Types.ObjectId(actorId);
    const ticket = await this.conversationModel
      .findOne({ _id: new Types.ObjectId(conversationId), type: 'LIVE_SUPPORT' })
      .select('participantA assignedAdminId supportStatus')
      .lean();

    if (!ticket) return false;

    if (options?.isAdmin) {
      const assignedAdminId = ticket.assignedAdminId ? new Types.ObjectId(String(ticket.assignedAdminId)) : null;
      return (
        ticket.supportStatus === 'WAITING_ADMIN' ||
        ticket.supportStatus === 'CLOSED' ||
        Boolean(assignedAdminId?.equals(aid))
      );
    }

    const participantA = ticket.participantA ? new Types.ObjectId(String(ticket.participantA)) : null;
    return Boolean(participantA?.equals(aid));
  }
}
