import { PartialType } from '@nestjs/mapped-types';
import { CreateCivilServantDto } from './create-civil-servant.dto';

export class UpdateCivilServantDto extends PartialType(CreateCivilServantDto) {}
