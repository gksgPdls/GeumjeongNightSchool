class EventParticipantInfo {
  id: number;
  name: string;
}

export class EventForListDto {
  id: number;
  event_date: string; // 'YYYY-MM-DD'
  class_type: string;
  description: string;
  
  // 간단한 참여자 정보만 포함
  teachers: EventParticipantInfo[];
  student_count: number;
}