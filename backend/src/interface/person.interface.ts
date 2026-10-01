import { ClassType, StudentClassSchedule, TeacherClassSchedule } from "./class.interface"


export enum PersonStatus {
  PROSPECTIVE = 'PROSPECTIVE',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface User {
  id: number;
  username: string; 
  email?: string;    
  // ...
}

export interface Teacher {
  id: number;
  name: string;
  birth_date: Date;
  phone_number?: string;
  schedules: TeacherClassSchedule[];
}

export interface Student {
  id: number;
  name: string;
  birth_date: Date;
  phone_number?: string;
  schedules: StudentClassSchedule[];  
}



