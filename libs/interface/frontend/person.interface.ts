import { ClassType } from '../shared/class.interface';
import { EventType } from '../calendar.interface';
import { Event, SpecialEvent } from './event.interface'

export interface Person {
  id: number;
  name: string;
  birth_date: Date;
  phone_number?: string;
  started_at: Date;
  finished_at?: Date;
}

export interface Level {
  category: string;
  level: number;
}

export interface Teacher extends Person {
  id: number;
  name: string;
  birth_date: Date;
  phone_number?: string;
  started_at: Date;
  finished_at?: Date;
  
  schedules: TeacherSchedule[];
  attendances: TeacherAttendance[];
  events : Event[];
  specialEvents : SpecialEvent[];
  levels : Level[];

  get_id(): number;
  get_name(): string;
  get_birth_date(): Date;
  get_phone_number(): string | undefined;
  get_started_at(): Date;
  get_finished_at(): Date | undefined;
  get_schedules(): TeacherSchedule[];
  get_attendances(): TeacherAttendance[];
  get_events() : Event[];
  get_specialEvents() : SpecialEvent[];
  // Num of levels should be num of departments
  get_levels : Level[];
  
  get_age(): number;
  get_years_of_service(): number;
  get_months_of_service(): number;
  get_is_active(): boolean;
  
  get_schedules_by_day(day_of_week: number): TeacherSchedule[];
  get_schedules_by_class(class_type: ClassType): TeacherSchedule[];
  get_class_types(): ClassType[];
  
  get_attendance_rate(): number;
  get_attendance_by_event_type(): Record<EventType, number>;
  get_recent_attendances(count?: number): TeacherAttendance[];
  
  set_phone_number(phone_number: string): Promise<void>;
  set_finished_at(date: Date): Promise<void>;
  set_attendance_byDate(event_id : number, time : Date): Promise<void>;

}

export interface Student extends Person {
  id: number;
  name: string;
  birth_date: Date;
  phone_number?: string;
  started_at: Date;
  finished_at?: Date;
  
  schedules: StudentSchedule[];
  attendances: StudentAttendance[];

  get_id(): number;
  get_name(): string;
  get_birth_date(): Date;
  get_phone_number(): string | undefined;
  get_started_at(): Date;
  get_finished_at(): Date | undefined;
  get_schedules(): StudentSchedule[];
  get_attendances(): StudentAttendance[];
  
  get_age(): number;
  get_is_active(): boolean;
  
  get_schedules_by_day(day_of_week: number): StudentSchedule[];
  get_schedules_by_class(class_type: ClassType): StudentSchedule[];
  
  get_attendance_rate(): number;
  get_attendance_by_class_type(): Record<ClassType, number>;
  get_recent_attendances(count?: number): StudentAttendance[];
  
  set_phone_number(phone_number: string): Promise<void>;
  set_finished_at(date: Date): Promise<void>;
}

export interface TeacherSchedule {
  id: number;
  teacher_id: number;
  class_type: ClassType;
  day_of_week: number;
  
  get_id(): number;
  get_teacher_id(): number;
  get_class_type(): ClassType;
  get_day_of_week(): number;
  get_class_name(): string;
  get_day_name(): string;
}

export interface StudentSchedule {
  id: number;
  student_id: number;
  class_type: ClassType;
  day_of_week: number;
  
  get_id(): number;
  get_student_id(): number;
  get_class_type(): ClassType;
  get_day_of_week(): number;
  get_class_name(): string;
  get_day_name(): string;
}

export interface TeacherAttendance {
  id: number;
  teacher_id: number;
  event_id: number;
  event_type: EventType;
  status: string;
  event_date: Date;
  
  get_id(): number;
  get_teacher_id(): number;
  get_event_id(): number;
  get_event_type(): EventType;
  get_status(): string;
  get_event_date(): Date;
  get_status_name(): string;
  get_is_present(): boolean;
}

export interface StudentAttendance {
  id: number;
  student_id: number;
  event_id: number;
  class_type?: ClassType;
  status: string;
  event_date: Date;
  
  get_id(): number;
  get_student_id(): number;
  get_event_id(): number;
  get_class_type(): ClassType | undefined;
  get_status(): string;
  get_event_date(): Date;
  get_status_name(): string;
  get_is_present(): boolean;
  get_class_name(): string | undefined;
}