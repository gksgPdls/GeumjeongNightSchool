import { Teacher } from './person.interface';

export enum TeacherDivisionLevel {
  UNAFFILIATED = 1, 
  MEMBER = 2,       
  HEAD = 3          
}

export enum DivisionType {
  ACADEMIC = 'ACADEMIC',             
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  SUPPORT = 'SUPPORT',               
  FINANCE = 'FINANCE',           
  ADVERTISE = 'ADVERTISE',               
}


export interface Division {
  id : number;
  name : string;
  type : DivisionType;
  description?: string;
  head_teacher_id: number;
  teacher_ids?: number[]; 
}


export interface TeacherDivisionMembership {
  id : number;
  name : string;
  teacher_id: number;
  division_type : DivisionType;

  is_primary: boolean;

  level: TeacherDivisionLevel; 
}