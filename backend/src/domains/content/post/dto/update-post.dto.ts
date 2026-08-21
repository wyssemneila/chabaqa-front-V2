import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from '@/domains/content/post/dto/create-post.dto';

/**
 * DTO pour mettre à jour un post
 * Tous les champs sont optionnels
 */
export class UpdatePostDto extends PartialType(CreatePostDto) {}
