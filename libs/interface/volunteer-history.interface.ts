import { Teacher } from './person.interface';
import { EventType, CalendarEvent, CalendarSpecialEvent } from './calendar.interface';

export enum VolunteerStatus {
  PENDING = 'PENDING',     
  APPROVED = 'APPROVED',   
  COMPLETED = 'COMPLETED', 
  REJECTED = 'REJECTED',   
}

export interface VolunteerHistory {
  id: number;
  volunteer_date: Date | string; 
  hours_volunteered: number;    
  description: string;          
  status: VolunteerStatus;       
  created_at: Date;
  updated_at: Date;

  teacher: Teacher; 

  event_type: EventType; 

  event?: CalendarEvent; 
  special_event?: CalendarSpecialEvent; 
}