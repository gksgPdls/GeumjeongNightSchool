import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    Check,
  } from 'typeorm';
  import { CalendarEventEntity, CalendarSpecialEventEntity } from './calendar/calendar.entity'; 
  import { TeacherEntity } from './person.entity'; 
  import { EventType} from 'night_school_app_dev_libs/interface/calendar.interface'; 
  import {VolunteerStatus} from 'night_school_app_dev_libs/interface/volunteer-history.interface'
  
  
  @Entity('volunteer_history')
  @Check(`(CASE WHEN calendar_event_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN calendar_special_event_id IS NOT NULL THEN 1 ELSE 0 END) = 1`)
  export class VolunteerHistoryEntity {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Index('idx_volunteer_teacher_id')
    @Column()
    teacher_id!: number;
  
    @Index('idx_volunteer_event_id', { unique: true, where: '"calendar_event_id" IS NOT NULL' })
    @Column({ nullable: true }) 
    calendar_event_id?: number;
  
    @Index('idx_volunteer_special_event_id')
    @Column({ nullable: true }) 
    calendar_special_event_id?: number;
  
    @Index('idx_volunteer_event_type')
    @Column({
      type: 'enum',
      enum: EventType, 
    })
    event_type!: EventType;
  
    @Index('idx_volunteer_date')
    @Column({ type: 'date' })
    volunteer_date!: Date; 
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    hours_volunteered?: number; 
  
    @Column({ type: 'text', nullable: true })
    description?: string; 
  
    @Index('idx_volunteer_status')
    @Column({
      type: 'enum',
      enum: VolunteerStatus,
      default: VolunteerStatus.PENDING,
    })
    status!: VolunteerStatus; 

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;
  
    @ManyToOne(() => TeacherEntity, teacher => teacher.volunteer_histories, {
      onDelete: 'RESTRICT',
      nullable: false, 
    })
    @JoinColumn({ name: 'teacher_id' })
    teacher!: TeacherEntity;
  
    
    @ManyToOne(() => CalendarEventEntity, event => event.volunteer_history, { 
      nullable: true, 
      onDelete: 'CASCADE', 
    })
    @JoinColumn({ name: 'calendar_event_id' })
    event?: CalendarEventEntity;
  
    @ManyToOne(() => CalendarSpecialEventEntity, event => event.volunteer_histories, { 
      nullable: true, 
      onDelete: 'CASCADE',
     })
    @JoinColumn({ name: 'calendar_special_event_id' })
    special_event?: CalendarSpecialEventEntity;
  }