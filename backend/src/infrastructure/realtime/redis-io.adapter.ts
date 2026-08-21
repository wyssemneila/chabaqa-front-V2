import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { ServerOptions } from 'socket.io';
import { writeStructuredLog } from '@/shared/utils/log-sanitizer.util';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: RedisClientType;
  private subClient?: RedisClientType;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<boolean> {
    const url = process.env.SOCKET_IO_REDIS_URL || process.env.REDIS_URL;
    if (!url) return false;

    const pubClient = createClient({ url });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (error) => writeStructuredLog('error', 'socket_redis_pub_error', { error }));
    subClient.on('error', (error) => writeStructuredLog('error', 'socket_redis_sub_error', { error }));

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
    } catch (error) {
      await Promise.all([this.closeRedisClient(pubClient), this.closeRedisClient(subClient)]);
      throw error;
    }

    this.pubClient = pubClient;
    this.subClient = subClient;
    this.adapterConstructor = createAdapter(pubClient, subClient);
    writeStructuredLog('info', 'socket_redis_adapter_enabled');
    return true;
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.closeRedisClient(this.pubClient),
      this.closeRedisClient(this.subClient),
    ]);

    this.pubClient = undefined;
    this.subClient = undefined;
    this.adapterConstructor = undefined;
  }

  private async closeRedisClient(client?: RedisClientType): Promise<void> {
    if (!client?.isOpen) return;

    try {
      await client.close();
    } catch {
      client.destroy();
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
