
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketAuthService } from '@/shared/services/socket-auth.service';
import { getCorsOriginHandler } from '@/shared/utils/security-config.util';

@WebSocketGateway({ cors: { origin: getCorsOriginHandler(), credentials: true } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  // Map<userId, Set<socketId>> to support multiple connections per user (web + mobile + tabs)
  private userSockets = new Map<string, Set<string>>();
  // Reverse index to quickly resolve userId by socketId for cleanup
  private socketToUser = new Map<string, string>();

  constructor(private readonly socketAuthService: SocketAuthService) {}

  async handleConnection(client: Socket) {
    try {
      const actor = await this.socketAuthService.authenticate(client);
      (client.data as any).actor = actor;
      this.registerAuthenticatedSocket(client, actor.id);
      this.logger.log(`Client connected: ${client.id} as ${actor.id}`);
    } catch (error) {
      this.logger.warn(`Rejected notification socket ${client.id}: ${(error as Error)?.message || 'auth failed'}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;

    this.socketToUser.delete(client.id);
    const set = this.userSockets.get(userId);
    if (!set) return;

    set.delete(client.id);
    if (set.size === 0) {
      this.userSockets.delete(userId);
      // Room will be empty; Socket.IO cleans up room automatically
    }
  }

  @SubscribeMessage('register')
  handleRegister(@ConnectedSocket() client: Socket, @MessageBody() userId: string): void {
    const authenticatedUserId = String((client.data as any)?.actor?.id || '').trim();
    if (!authenticatedUserId) {
      client.disconnect(true);
      return;
    }

    if (userId && userId !== authenticatedUserId) {
      this.logger.warn(`Ignored notification room spoof attempt socket=${client.id} requested=${userId} actor=${authenticatedUserId}`);
    }

    this.registerAuthenticatedSocket(client, authenticatedUserId);
  }

  @SubscribeMessage('unregister')
  handleUnregister(@ConnectedSocket() client: Socket): void {
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;
    this.logger.log(`User unregistered: ${userId} socket ${client.id}`);
    this.handleDisconnect(client);
    try { client.leave(this.roomForUser(userId)); } catch {}
  }

  sendNotificationToUser(userId: string, notification: any): void {
    // Emit to the user's room to cover all active sockets
    this.server.to(this.roomForUser(userId)).emit('notification', notification);
  }

  /** Send a notification to many users efficiently */
  sendNotificationToUsers(userIds: string[], notification: any): void {
    const rooms = userIds.map((id) => this.roomForUser(id));
    if (rooms.length > 0) {
      this.server.to(rooms).emit('notification', notification);
    }
  }

  private roomForUser(userId: string): string {
    return `user:${userId}`;
  }

  private registerAuthenticatedSocket(client: Socket, userId: string): void {
    this.socketToUser.set(client.id, userId);
    const set = this.userSockets.get(userId) || new Set<string>();
    set.add(client.id);
    this.userSockets.set(userId, set);
    client.join(this.roomForUser(userId));
  }
}
