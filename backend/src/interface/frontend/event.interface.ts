import { ClassType, AttendanceStatus } from "..//shared/class.interface";

export enum EventType {
  HOLIDAY = 'HOLIDAY',
  CLASS = 'CLASS',
  MEETING = 'MEETING',
  ACTIVITY = 'ACTIVITY'
}

export interface BaseEvent {
  id: number;
  event_date: Date;
  description?: string;
}

// 수업 이벤트 (CalendarEvent 중 event_type이 CLASS인 경우)
export interface Event extends BaseEvent {
  class_type: ClassType;
  teachers: { id: number; name: string }[];
  students: { id: number; name: string }[];

  
  // 메소드
  get_id(): number;
  get_class_type(): ClassType;
  get_event_date(): Date;
  get_description(): string | undefined;
  get_teachers(): { id: number; name: string }[];
  get_students(): { id: number; name: string }[];
  get_is_recurring(): boolean;
  get_recurrence_pattern(): string | undefined;
  
  // 계산 메소드
  get_class_name(): string;
  get_formatted_date(format?: string): string;
  get_day_of_week(): number;
  get_day_name(): string;
  get_student_count(): number;
  
  // 업데이트 메소드
  set_description(description: string): Promise<void>;
  set_event_date(date: Date): Promise<void>;
  add_student(studentId: number, studentName: string): Promise<void>;
  remove_student(studentId: number): Promise<void>;
  add_teacher(teacherId: number, teacherName: string): Promise<void>;
  remove_teacher(teacherId: number): Promise<void>;
}


export interface SpecialEvent extends BaseEvent {
  event_type: Exclude<EventType, EventType.CLASS>; 
  custom_title?: string;
  event_start_date: Date;
  event_end_date: Date;
  participants?: { id: number; name: string; type: 'TEACHER' | 'STUDENT' }[];
  
  get_id(): number;
  get_event_type(): EventType;
  get_custom_title(): string | undefined;
  get_event_date(): Date;
  get_event_start_date(): Date;
  get_event_end_date(): Date;
  get_description(): string | undefined;
  get_participants(): { id: number; name: string; type: 'TEACHER' | 'STUDENT' }[];
  
  get_formatted_date(format?: string): string;
  get_duration_days(): number;
  get_is_multi_day(): boolean;
  get_type_name(): string;
  
  set_description(description: string): Promise<void>;
  set_event_dates(startDate: Date, endDate: Date): Promise<void>;
  set_custom_title(title: string): Promise<void>;
  add_participant(id: number, name: string, type: 'TEACHER' | 'STUDENT'): Promise<void>;
  remove_participant(id: number, type: 'TEACHER' | 'STUDENT'): Promise<void>;
}

// 날짜 기준 이벤트 조회를 위한 일자 인터페이스
export interface Day {
  date: Date;
  events: Event[];
  special_events: SpecialEvent[];
  
  // 메소드
  get_date(): Date;
  get_events(): Event[];
  get_special_events(): SpecialEvent[];
  get_all_events(): (Event | SpecialEvent)[];
  get_formatted_date(format?: string): string;
  get_day_name(): string;
  get_day_of_week(): number;
  get_is_weekend(): boolean;
  get_is_holiday(): boolean;
  get_available_class_types(): ClassType[];
}