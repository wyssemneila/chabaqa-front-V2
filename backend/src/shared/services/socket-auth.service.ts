import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';
import { Admin, AdminDocument } from '@/infrastructure/database/schemas/auth/admin.schema';
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service';
import { getJwtSecret } from '@/shared/utils/security-config.util';

export type SocketActor = {
  id: string;
  email?: string;
  role?: string;
  isAdmin: boolean;
};

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  async authenticate(client: Socket): Promise<SocketActor> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing socket token');
    }

    const payload: any = this.jwtService.verify(token, { secret: getJwtSecret() });
    const subject = String(payload?.sub || payload?.userId || '').trim();
    if (!subject) {
      throw new UnauthorizedException('Invalid socket token subject');
    }

    const tokenId = payload?.jti || `${subject}-${payload?.iat || ''}`;
    if (await this.tokenBlacklistService.isTokenRevoked(tokenId, subject)) {
      throw new UnauthorizedException('Revoked socket token');
    }

    const role = String(payload?.role || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'moderator'].includes(role);

    if (isAdmin) {
      const admin = await this.adminModel.findById(subject).select('email role accountStatus status isSuspended').lean();
      if (!admin) throw new UnauthorizedException('Admin not found');

      const status = String((admin as any).accountStatus || (admin as any).status || 'active').toLowerCase();
      if ((admin as any).isSuspended || ['suspended', 'deleted', 'inactive'].includes(status)) {
        throw new UnauthorizedException('Admin account disabled');
      }

      return {
        id: subject,
        email: (admin as any).email,
        role: (admin as any).role || role,
        isAdmin: true,
      };
    }

    const user = await this.userModel.findById(subject).select('email role accountStatus isSuspended').lean();
    if (!user) throw new UnauthorizedException('User not found');

    const status = String((user as any).accountStatus || 'active').toLowerCase();
    if ((user as any).isSuspended || ['suspended', 'deleted', 'inactive'].includes(status)) {
      throw new UnauthorizedException('User account disabled');
    }

    return {
      id: subject,
      email: (user as any).email,
      role: (user as any).role || role,
      isAdmin: false,
    };
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.trim()) {
      return authorization.replace(/^Bearer\s+/i, '').trim();
    }

    const cookieHeader = String(client.handshake.headers.cookie || '');
    const cookies = this.parseCookies(cookieHeader);
    return (
      cookies.accessToken ||
      cookies.adminAccessToken ||
      cookies.access_token ||
      cookies.admin_access_token ||
      ''
    ).trim();
  }

  private parseCookies(header: string): Record<string, string> {
    return header.split(';').reduce<Record<string, string>>((acc, part) => {
      const [rawName, ...rest] = part.trim().split('=');
      if (!rawName || rest.length === 0) return acc;
      acc[rawName] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
  }
}
