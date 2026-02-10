import { PartialType } from '@nestjs/swagger';
import { CreateWhatsappRoutineDto } from './create-whatsapp-routine.dto';

export class UpdateWhatsappRoutineDto extends PartialType(CreateWhatsappRoutineDto) {}
