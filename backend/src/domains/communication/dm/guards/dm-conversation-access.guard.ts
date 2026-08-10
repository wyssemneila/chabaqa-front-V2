import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DmService } from '@/domains/communication/dm/dm.service';

/**
 * Authorizes a DM conversation before a request body or multipart upload is
 * processed. In particular, this prevents unauthorized callers from causing
 * Multer to persist orphan attachment files.
 */
@Injectable()
export class DmConversationAccessGuard implements CanActivate {
  constructor(private readonly dmService: DmService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const conversationId = String(request?.params?.conversationId || '').trim();
    const userId = String(
      request?.user?._id ||
      request?.user?.userId ||
      request?.user?.sub ||
      request?.user?.id ||
      '',
    ).trim();
    const role = String(request?.user?.role || '').toLowerCase();
    const isAdmin = request?.user?.isAdmin === true || ['admin', 'super_admin', 'moderator'].includes(role);

    await this.dmService.assertConversationAccess(conversationId, userId, {
      isAdmin,
      // An admin may claim an unassigned help thread by sending their first
      // reply, including an attachment. Keep the pre-upload authorization
      // consistent with sendMessageRich's claim behavior.
      allowUnassignedHelpAdmin: isAdmin,
    });
    return true;
  }
}
