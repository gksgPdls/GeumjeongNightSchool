
import { ClassType } from "./class.interface";
import { AttendanceStatus } from "./attendance.interface";
import { StudentAttendance, TeacherAttendance } from "./attendance.interface";

export enum EventType {
    HOLIDAY = 'HOLIDAY',
    CLASS = 'CLASS',
    MEETING = 'MEETING',
    ACTIVITY = 'ACTIVITY'
  }

export type CalendarDay = Date;

export interface CalendarEvent {
    id: number;
    event_date: Date;
    event_type: EventType;
    class_type?: ClassType;
    created_at : Date;
    updated_at : Date;
    description: string;
    teacher_attendances: TeacherAttendance[];
    student_attendances?: StudentAttendance[];
    teacher_ids : number[];
    student_ids : number[];
}

export interface CalendarSpecialEvent {
    id : number;
    custom_event_type : string;
    event_start_date : Date;
    event_end_date : Date;
    created_at : Date;
    updated_at : Date;
}
