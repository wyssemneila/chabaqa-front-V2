import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AiPublishService {
  async publishDraft(
    draftType: string,
    draftPayload: Record<string, any>,
    confirm: boolean,
  ) {
    if (!confirm) {
      throw new BadRequestException(
        'Publishing AI drafts requires confirm=true',
      );
    }
    const normalized = this.normalizeDraft(draftType, draftPayload);
    return {
      success: true,
      status: 'draft',
      draftType,
      draft: normalized,
      message:
        'Draft validated. Connect this type to its domain service before auto-saving in production.',
    };
  }

  private normalizeDraft(draftType: string, draftPayload: Record<string, any>) {
    if (!draftPayload || typeof draftPayload !== 'object') {
      throw new BadRequestException('draftPayload must be an object');
    }
    if (draftType === 'course') return { ...draftPayload, isPublished: false };
    if (draftType === 'challenge') return { ...draftPayload, isActive: false };
    if (['event', 'product'].includes(draftType))
      return { ...draftPayload, isPublished: false };
    if (draftType === 'session') return { ...draftPayload, isActive: false };
    if (draftType === 'community') return { ...draftPayload, status: 'draft' };
    return { ...draftPayload, status: draftPayload.status || 'draft' };
  }
}
