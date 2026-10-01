import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';
import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';

export class CreateEventDto {
  @IsEnum(EventType)
  @IsNotEmpty()
  event_type: EventType;

  @IsDateString()
  @IsNotEmpty()
  event_date: string; // "2025-06-08"

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateIf(o => o.event_type === EventType.CLASS)
  @IsEnum(ClassType)
  @IsNotEmpty()
  class_type: ClassType; 
  @ValidateIf(o => o.event_type === EventType.CLASS)
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  teacher_ids: number[];

  @ValidateIf(o => o.event_type === EventType.CLASS)
  @IsArray()
  @IsNumber({}, { each: true })
  student_ids: number[];
}