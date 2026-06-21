import { PartialType } from '@nestjs/mapped-types';
import { CreateGiftCalendarDto } from './create-gift-calendar.dto';

export class UpdateGiftCalendarDto extends PartialType(CreateGiftCalendarDto) {}
