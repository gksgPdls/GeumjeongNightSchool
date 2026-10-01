import { EventType } from "./calendar.interface";

// --------------------- About Class Types --------------------------
  
export enum ClassType {
  DAISY = 'DAISY',                 // 개나리반   
  DANDELION = 'DANDELION',         // 민들레반
  ROSE = 'ROSE',                   // 장미반
  SUNFLOWER = 'SUNFLOWER',         // 해바라기반
  CHRYSANTHEMUM = 'CHRYSANTHEMUM', // 국화반
  CAMELLIA = 'CAMELLIA',           // 동백반
  SPROUT1 = 'SPROUT1',             // 새싹1반
  SPROUT2 = 'SPROUT2',             // 새싹2반
  TREE1 = 'TREE1',                 // 나무1반
  TREE2 = 'TREE2',                 // 나무2반
  FRUIT = 'FRUIT',                 // 열매반
  SMARTPHONE = 'SMARTPHONE',       // 스마트폰반
  UNKNOWN = 'UNKNOWN'              // 미정
}

export const ClassTypeNames: Record<ClassType, string> = {
  [ClassType.DAISY]: '개나리반',
  [ClassType.DANDELION]: '민들레반',
  [ClassType.ROSE]: '장미반',
  [ClassType.SUNFLOWER]: '해바라기반',
  [ClassType.CHRYSANTHEMUM]: '국화반',
  [ClassType.CAMELLIA]: '동백반',
  [ClassType.SPROUT1]: '새싹1반',
  [ClassType.SPROUT2]: '새싹2반',
  [ClassType.TREE1]: '나무1반',
  [ClassType.TREE2]: '나무2반',
  [ClassType.FRUIT]: '열매반',
  [ClassType.SMARTPHONE]: '스마트폰반',
  [ClassType.UNKNOWN]: '미정'
};

export const ClassScheduleConfig = {
  weekday: [
    ClassType.DAISY,      
    ClassType.DANDELION,  
    ClassType.ROSE,       
    ClassType.SUNFLOWER,  
    ClassType.CHRYSANTHEMUM, 
    ClassType.CAMELLIA    
  ],
  
  weekend: [
    ClassType.SPROUT1,    
    ClassType.SPROUT2,    
    ClassType.TREE1,      
    ClassType.TREE2,      
    ClassType.FRUIT,      
    ClassType.SMARTPHONE  
  ]
};

export function getDayType(dayOfWeek: number): 'weekday' | 'weekend' | 'sunday' {
  if (dayOfWeek === 0) return 'sunday';  
  if (dayOfWeek === 6) return 'weekend'; 
  return 'weekday';
}

export function getClassTypesForDay(dayOfWeek: number): ClassType[] {
  const dayType = getDayType(dayOfWeek);
  if (dayType === 'sunday') return [];
  return ClassScheduleConfig[dayType];
}

// ------------------------------------------------------------------


export interface Class {
  id: number;
  name: string;
  class_type: ClassType;
  subjects?: string[];
  class_goals?: string[];
  teacher_ids : number[];
  student_ids : number[];
  created_at: Date;
  updated_at: Date;
}

export interface StudentClassSchedule {
  class_type: ClassType;
  day_of_week: number;
}

export interface TeacherClassSchedule {
  class_type: ClassType;
  day_of_week: number;
}