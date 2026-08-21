import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from '@/domains/commerce/event/dto/create-event.dto';

/**
 * DTO pour mettre à jour un événement
 */
export class UpdateEventDto extends PartialType(CreateEventDto) {}

