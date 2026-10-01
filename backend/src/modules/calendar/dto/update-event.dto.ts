import { CreateEventDto } from "./create-event.dto";
import { PartialType } from '@nestjs/mapped-types';
import { ClassType } from "night_school_app_dev_libs/interface/class.interface";


export class UpdateEventDto {
  // @IsOptional()
  // @IsString()
  description?: string;

  // @IsOptional()
  // @IsEnum(ClassType)
  class_type?: ClassType;

  // @IsOptional()
  // @IsArray()
  // @IsNumber({}, { each: true })
  teacher_ids?: number[];
  
  // @IsOptional()
  // @IsArray()
  // @IsNumber({}, { each: true })
  student_ids?: number[];
}