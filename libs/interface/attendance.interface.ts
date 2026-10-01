import { ClassType } from "./class.interface";
import { EventType } from "./calendar.interface";

export enum AttendanceStatus {
  PRESENT = 'PRESENT',       
  ABSENT = 'ABSENT',         
  LATE = 'LATE',             
  EXCUSED = 'EXCUSED',       
  UNASSIGNED = 'UNASSIGNED',
  CANCELLED = 'CANCELLED'
}

export interface StudentAttendance {
  id: number;
  student: {
    id: number;
    name: string;
  };
  event_id: number;
  class_type?: ClassType;
  status: AttendanceStatus;
  event_date: Date; 
  check_in_time?: Date
}
  
export interface TeacherAttendance {
  id: number;
  teacher: {
    id: number;
    name: string;
  };
  event_id: number;
  event_type: EventType;
  status: AttendanceStatus;
  event_date: Date;
  check_in_time?:Date
}