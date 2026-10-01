import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  ManyToOne,
} from 'typeorm';

import {
  ClassType
} from 'night_school_app_dev_libs/interface/class.interface'

import {
  AttendanceStatus
} from 'night_school_app_dev_libs/interface/attendance.interface'

import {
  EventType
} from 'night_school_app_dev_libs/interface/calendar.interface'

import { CalendarEventEntity, 
         CalendarSpecialEventEntity, 
         CalendarEventTeacherEntity,
         CalendarSpecialEventTeacherEntity,
         CalendarSpecialEventStudentEntity} from './calendar/calendar.entity'

import { ClassExchangeParticipantEntity } from './calendar/class-exchange.entity'
import { ClassCancellationEntity } from './calendar/class-cancellation.entity'

import { UserEntity} from './user.entity'

import { ClassEntity} from './class.entity'

import { DivisionEntity, TeacherDivisionMembershipEntity } from './division.entity';

import { VolunteerHistoryEntity } from './volunteer-history.entity';

export enum PersonStatus {
  PROSPECTIVE = 'PROSPECTIVE',
  ACTIVE = 'ACTIVE', 
  INACTIVE = 'INACTIVE',
}
/**
 * Implementatoin of "Teacher"
 * 
 */

@Entity('teachers')
export class TeacherEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number?: string;

  @Column({ type: 'date' })
  birth_date!: Date;

  @Column({ nullable: true })
  division_id!: number;

  @OneToOne(() => UserEntity, user => user.teacher) 
  user!: UserEntity; 

  @Column({ type: 'date', nullable: true })
  started_at?: Date;

  @Column({ type: 'date', nullable: true })
  finished_at?: Date;

  @Index() 
  @Column({
    type: 'enum',
    enum: PersonStatus,
    default: PersonStatus.ACTIVE
  })
  status!: PersonStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @OneToMany(() => TeacherClassScheduleEntity, schedule => schedule.teacher)
  class_schedules!: TeacherClassScheduleEntity[];

  @OneToMany(() => CalendarEventTeacherEntity, eventTeacher => eventTeacher.teacher)
  calendar_event_teachers?: CalendarEventTeacherEntity[];

  @OneToMany(() => CalendarSpecialEventTeacherEntity, eventTeacher => eventTeacher.teacher)
  calendar_special_event_teachers!: CalendarSpecialEventTeacherEntity[];
  
  @OneToMany(() => TeacherAttendanceEntity, attendance => attendance.teacher)
  attendances?: TeacherAttendanceEntity[];

  @OneToMany(() => SpecialEventTeacherAttendanceEntity, attendance => attendance.teacher)
  special_attendances?: SpecialEventTeacherAttendanceEntity[];

  @OneToMany(() => ClassCancellationEntity, cancellation => cancellation.teacher)
  class_cancellations?: ClassCancellationEntity[];

  @OneToMany(() => ClassExchangeParticipantEntity, participant => participant.teacher)
  exchangeParticipations?: ClassExchangeParticipantEntity[];

  @OneToMany(() => TeacherDivisionMembershipEntity, membership => membership.teacher)
  division_memberships: TeacherDivisionMembershipEntity[]; 

  @OneToMany(() => VolunteerHistoryEntity, history => history.teacher)
  volunteer_histories?: VolunteerHistoryEntity[];
}

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number?: string;

  @Column({ type: 'date' })
  birth_date!: Date;

  @Column({ type: 'date', nullable: true })
  started_at?: Date;

  @Column({ type: 'date', nullable: true })
  finished_at?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @Index() 
  @Column({
    type: 'enum',
    enum: PersonStatus,
    default: PersonStatus.ACTIVE
  })
  status!: PersonStatus;

  @OneToMany(() => StudentClassScheduleEntity, schedule => schedule.student)
  class_schedules!: StudentClassScheduleEntity[];

  @OneToMany(() => StudentAttendanceEntity, attendance => attendance.student)
  attendances?: StudentAttendanceEntity[];

  @OneToMany(() => SpecialEventStudentAttendanceEntity, attendance => attendance.student)
  special_attendances?: SpecialEventStudentAttendanceEntity[];


  @OneToMany(() => CalendarSpecialEventStudentEntity, studentEvent => studentEvent.student)
  calendar_special_event_students!: CalendarSpecialEventStudentEntity[];
}

@Entity('teacher_class_schedules')
@Index(['teacher_id', 'class_type', 'day_of_week'], { unique: true })
export class TeacherClassScheduleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  teacher_id!: number;

  @Column({
    type: 'enum',
    enum: ClassType,
    nullable: true
  })
  class_type?: ClassType;

 @Column({ type: 'int' })
  day_of_week!: number;

  @ManyToOne(() => TeacherEntity, teacher => teacher.class_schedules, {
    onDelete: 'CASCADE', 
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;

  @Column({ nullable: true })
  class_id?: number;

  @ManyToOne(() => ClassEntity, class_ => class_.teacherSchedules, {
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name : 'class_id'})
  class! : ClassEntity;



}


@Entity('student_class_schedules')
@Index(['student_id', 'class_type', 'day_of_week'], { unique: true })
export class StudentClassScheduleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  student_id!: number;

  @Column({
    type: 'enum',
    enum: ClassType,
    nullable: true
  })
  class_type?: ClassType;

  @Column({ type: 'int' })
  day_of_week!: number;

  @ManyToOne(() => StudentEntity, student => student.class_schedules, {
    onDelete: 'CASCADE', 
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'student_id' })
  student!: StudentEntity;

  @Column({ nullable: true })
  class_id?: number;

  @ManyToOne(() => ClassEntity, class_ => class_.studentEnrollments, {
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name : 'class_id'})
  class! : ClassEntity;


}

@Entity('teacher_attendance')
@Index(['teacher_id', 'calendar_event_id'], { unique: true, where: '"calendar_event_id" IS NOT NULL' })
export class TeacherAttendanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  teacher_id!: number;

  @Column({ nullable: true })
  calendar_event_id?: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT
  })
  status!: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.CLASS
  })
  event_type!: EventType;

  @Column({
    type: 'enum',
    enum: ClassType,
    nullable: true
  })
  class_type?: ClassType;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  @ManyToOne(() => TeacherEntity, teacher => teacher.attendances, {
    onDelete: 'RESTRICT', 
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;

  @ManyToOne(() => CalendarEventEntity, {
    nullable: true,
    onDelete: 'CASCADE', 
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'calendar_event_id' })
  event?: CalendarEventEntity;

}

@Entity('student_attendance')
@Index(['student_id', 'calendar_event_id'], { unique: true, where: '"calendar_event_id" IS NOT NULL' })
export class StudentAttendanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  student_id!: number;

  @Column({ nullable: true })
  calendar_event_id?: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT
  })
  status!: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  @ManyToOne(() => StudentEntity, student => student.attendances,{
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'student_id' })
  student!: StudentEntity;

  @ManyToOne(() => CalendarEventEntity, {
    nullable : true,
    onDelete : 'CASCADE',
    onUpdate : 'RESTRICT'})
  @JoinColumn({ name: 'calendar_event_id' })
  event?: CalendarEventEntity;

}

@Entity('special_event_teacher_attendance')
@Index(['special_event', 'teacher'], { unique: true }) 
export class SpecialEventTeacherAttendanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'special_event_id' })
  specialEventId!: number;

  @Column({ name: 'teacher_id' })
  teacherId!: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status!: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @ManyToOne(() => CalendarSpecialEventEntity, event => event.special_teacher_attendances, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'special_event_id' })
  special_event!: CalendarSpecialEventEntity;

  @ManyToOne(() => TeacherEntity, teacher => teacher.special_attendances, { 
    onDelete: 'CASCADE', 
    nullable: false,
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;
}

@Entity('special_event_student_attendance')
@Index(['special_event', 'student'], { unique: true }) 
export class SpecialEventStudentAttendanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'special_event_id' })
  specialEventId!: number;

  @Column({ name: 'student_id' })
  studentId!: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true})
  check_in_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  @Column({ type: 'text', nullable: true, comment: '비고 사항' })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @ManyToOne(() => CalendarSpecialEventEntity, event => event.special_student_attendances, {
    onDelete: 'CASCADE', 
    nullable: false,
  })
  @JoinColumn({ name: 'special_event_id' })
  special_event!: CalendarSpecialEventEntity;

  @ManyToOne(() => StudentEntity, student => student.special_attendances, {
    onDelete: 'CASCADE', 
    nullable: false,
  })
  @JoinColumn({ name: 'student_id' })
  student!: StudentEntity;
}