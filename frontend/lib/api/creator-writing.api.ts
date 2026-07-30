import { apiClient } from './client'

export type CreatorWritingSurface = 'community'|'course'|'challenge'|'event'|'product'|'session'|'post'|'campaign'
export type CreatorWritingField = 'title'|'description'|'content'|'subject'|'cta'|'requirements'|'objectives'
export type CreatorWritingAction = 'generate'|'improve'|'rewrite'|'shorten'|'expand'
export type CreatorWritingTone = 'professional'|'friendly'|'inspiring'|'educational'|'persuasive'|'concise'

export interface CreatorWritingUsage { metric:string; plan:string; used:number; limit:number; remaining:number; percentage:number; periodStart:string; periodEnd:string }
export interface CreatorWritingRequest { contentType:CreatorWritingSurface; field:CreatorWritingField; action:CreatorWritingAction; tone?:CreatorWritingTone; language?:'en'|'fr'|'ar'; context:string; currentValue?:string; maxCharacters?:number; keywords?:string[] }

const unwrap = <T>(value:any):T => (value?.data?.data ?? value?.data ?? value) as T
export const creatorWritingApi = {
  generate: async (communityId:string, payload:CreatorWritingRequest) => unwrap<{content:string;usage:CreatorWritingUsage}>(await apiClient.post(`/creator-writing/communities/${communityId}/generate`, payload)),
  usage: async () => unwrap<CreatorWritingUsage>(await apiClient.get('/creator-writing/usage')),
}
