import { AttendanceStatus } from "night_school_app_dev_libs/interface/attendance.interface";

class ParticipantDetailDto {
  id: number;
  name: string;
  attendance_status: AttendanceStatus;
}

export class EventDetailDto {
  id: number;
  event_date: string; // 'YYYY-MM-DD'
  class_type: string;
  description: string;
  
  // 출석 상태를 포함한 전체 참여자 정보
  teachers: ParticipantDetailDto[];
  students: ParticipantDetailDto[];
}