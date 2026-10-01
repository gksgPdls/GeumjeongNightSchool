import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  CancellationToken
} from 'typeorm';
import { 
  CalendarDay,
  CalendarEvent,
  CalendarSpecialEvent,
  EventType
} from 'night_school_app_dev_libs/interface/calendar.interface';
import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';
import { StudentEntity, TeacherEntity, StudentAttendanceEntity, TeacherAttendanceEntity, SpecialEventTeacherAttendanceEntity, SpecialEventStudentAttendanceEntity } from '../person.entity';
import { CalendarEventDescriptionEntity, CalendarSpecialEventDescriptionEntity } from './calendar-description.entity';
import { VolunteerHistoryEntity } from '../volunteer-history.entity';
import { ClassExchangeEntity } from './class-exchange.entity';
import { ClassCancellationEntity } from './class-cancellation.entity';

@Entity('calendar_event')
export class CalendarEventEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  event_date!: CalendarDay;

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
  class_type!: ClassType;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @OneToOne(() => CalendarEventDescriptionEntity, description => description.event, {
    cascade: true
  })
  @JoinColumn()
  description!: CalendarEventDescriptionEntity;

  @OneToMany(() => CalendarEventTeacherEntity, teacherEvent => teacherEvent.event, {
    cascade: true
  })
  teachers_event!: CalendarEventTeacherEntity[];

  @OneToMany(() => CalendarEventStudentEntity, studentEvent => studentEvent.event, {
    cascade: true,
    nullable: true
  })
  students_event!: CalendarEventStudentEntity[];

  @OneToMany(() => TeacherAttendanceEntity, attendance => attendance.event)
  teacher_attendances!: TeacherAttendanceEntity[];

  @OneToMany(() => StudentAttendanceEntity, attendance => attendance.event)
  student_attendances!: StudentAttendanceEntity[];

  @ManyToOne(() => ClassExchangeEntity, exchange => exchange.events, {nullable : true})
  @JoinColumn({ name: 'exchange_id' })
  exchange?: ClassExchangeEntity;

  @OneToOne(() => ClassCancellationEntity, cancel => cancel.event, {nullable : true})
  @JoinColumn({name: 'cancel_id'})
  cancel? : ClassCancellationEntity;

  @OneToOne(() => VolunteerHistoryEntity, history => history.event, {
    cascade: true, 
    nullable: true,
  })
  volunteer_history?: VolunteerHistoryEntity; 
}


@Entity('calendar_event_teacher')
export class CalendarEventTeacherEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: number;

  @Column()
  teacher_id!: number;

  @ManyToOne(() => CalendarEventEntity, event => event.teachers_event, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'event_id' })
  event!: CalendarEventEntity;

  @ManyToOne(() => TeacherEntity, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;
}

@Entity('calendar_event_student')
export class CalendarEventStudentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: number;

  @Column()
  student_id!: number;

  @ManyToOne(() => CalendarEventEntity, event => event.students_event,{
    onDelete:'CASCADE'
  })
  @JoinColumn({ name: 'event_id' })
  event!: CalendarEventEntity;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'student_id' })
  student!: StudentEntity;
}



@Entity('calendar_special_event')
export class CalendarSpecialEventEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  custom_event_type!: string;

  @Column({ type : 'date'})
  event_start_date!: Date;

  @Column({ type : 'date'})
  event_end_date!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @OneToOne(() => CalendarSpecialEventDescriptionEntity, description => description.event, {
    cascade: true
  })
  @JoinColumn()
  description!: CalendarSpecialEventDescriptionEntity;

  @OneToMany(() => CalendarSpecialEventTeacherEntity, teacherEvent => teacherEvent.event, {
    cascade: true
  })
  teachers!: CalendarSpecialEventTeacherEntity[];

  @OneToMany(() => CalendarSpecialEventStudentEntity, studentEvent => studentEvent.event, {
    cascade: true,
    nullable: true
  })
  students?: CalendarSpecialEventStudentEntity[];

  @OneToMany(() => SpecialEventTeacherAttendanceEntity, attendance => attendance.special_event)
  special_teacher_attendances!: SpecialEventTeacherAttendanceEntity[];

  @OneToMany(() => SpecialEventStudentAttendanceEntity, attendance => attendance.special_event)
  special_student_attendances?: SpecialEventStudentAttendanceEntity[];

  
  @OneToMany(() => VolunteerHistoryEntity, history => history.special_event, {
    cascade: true, // Optional
  })
  volunteer_histories?: VolunteerHistoryEntity[];

}

@Entity('calendar_special_event_teacher')
export class CalendarSpecialEventTeacherEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: number;

  @Column()
  teacher_id!: number;

  @ManyToOne(() => CalendarSpecialEventEntity, event => event.teachers, {onDelete : 'CASCADE'})
  @JoinColumn({ name: 'event_id' })
  event!: CalendarSpecialEventEntity;

  @ManyToOne(() => TeacherEntity, teacher => teacher.calendar_special_event_teachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;
}

@Entity('calendar_special_event_student')
export class CalendarSpecialEventStudentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: number;

  @Column()
  student_id!: number;

  @ManyToOne(() => CalendarSpecialEventEntity, event => event.students, {onDelete : 'CASCADE'})
  @JoinColumn({ name: 'event_id' })
  event!: CalendarSpecialEventEntity;

  @ManyToOne(() => StudentEntity, student => student.calendar_special_event_students, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'student_id' })
  student!: StudentEntity;
}