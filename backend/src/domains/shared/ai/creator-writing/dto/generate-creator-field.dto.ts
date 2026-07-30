import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum CreatorWritingContentType { COMMUNITY='community', COURSE='course', CHALLENGE='challenge', EVENT='event', PRODUCT='product', SESSION='session', POST='post', CAMPAIGN='campaign' }
export enum CreatorWritingField { TITLE='title', DESCRIPTION='description', CONTENT='content', SUBJECT='subject', CTA='cta', REQUIREMENTS='requirements', OBJECTIVES='objectives' }
export enum CreatorWritingAction { GENERATE='generate', IMPROVE='improve', REWRITE='rewrite', SHORTEN='shorten', EXPAND='expand' }
export enum CreatorWritingTone { PROFESSIONAL='professional', FRIENDLY='friendly', INSPIRING='inspiring', EDUCATIONAL='educational', PERSUASIVE='persuasive', CONCISE='concise' }
export enum CreatorWritingLanguage { EN='en', FR='fr', AR='ar' }

export class GenerateCreatorFieldDto {
  @IsEnum(CreatorWritingContentType) contentType: CreatorWritingContentType;
  @IsEnum(CreatorWritingField) field: CreatorWritingField;
  @IsEnum(CreatorWritingAction) action: CreatorWritingAction;
  @IsOptional() @IsEnum(CreatorWritingTone) tone?: CreatorWritingTone;
  @IsOptional() @IsEnum(CreatorWritingLanguage) language?: CreatorWritingLanguage;
  @IsString() @MaxLength(5000) context: string;
  @IsOptional() @IsString() @MaxLength(10000) currentValue?: string;
  @IsOptional() @IsInt() @Min(20) @Max(4000) maxCharacters?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(80, { each: true }) keywords?: string[];
}
