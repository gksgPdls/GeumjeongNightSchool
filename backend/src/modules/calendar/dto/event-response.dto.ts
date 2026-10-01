import { Expose, Exclude, Type } from 'class-transformer';
import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';
import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttendanceStatus } from 'night_school_app_dev_libs/interface/attendance.interface';

@Exclude()
export class EventResponseDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEnum(EventType)
  event_type!: EventType;

  @Expose()
  @IsOptional()
  @IsEnum(ClassType)
  class_type?: ClassType;

  @Expose()
  @Type(() => Date)
  @IsDate()
  event_date!: Date;

  @Expose()
  @IsDate()
  created_at! : Date;

  @Expose()
  @IsDate()
  updated_at! : Date;
  
}

@Exclude()
class ParticipantDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  name!: string;
}

@Exclude()
export class EventDetailResponseDto extends EventResponseDto {
  @Expose()
  @IsString()
  description!: string;

  @Expose()
  @Type(() => ParticipantDto)
  @ValidateNested({ each: true })
  @IsArray()
  teachers!: ParticipantDto[];

  @Expose()
  @IsOptional()
  @Type(() => ParticipantDto)
  @ValidateNested({ each: true })
  @IsArray()
  students?: ParticipantDto[];
}

// 선택적으로 캘린더 뷰에서 사용할 수 있는 더 자세한 응답 DTO
@Exclude()
export class EventCalendarResponseDto extends EventDetailResponseDto {
  @Expose()
  @Type(() => StudentAttendanceDto)
  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  student_attendances?: StudentAttendanceDto[];

  @Expose()
  @Type(() => TeacherAttendanceDto)
  @ValidateNested({ each: true })
  @IsArray()
  teacher_attendances!: TeacherAttendanceDto[];
}

@Exclude()
class StudentAttendanceDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsNumber()
  student_id!: number;

  @Expose()
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @Expose()
  @IsOptional()
  @IsEnum(ClassType)
  class_type?: ClassType;
}

@Exclude()
class TeacherAttendanceDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsNumber()
  teacher_id!: number;

  @Expose()
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @Expose()
  @IsEnum(EventType)
  event_type!: EventType;
}