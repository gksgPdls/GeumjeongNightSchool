import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToOne, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn,
  Index
} from 'typeorm';

import { CalendarEventEntity } from './calendar.entity';
import { TeacherEntity } from '../person.entity';

@Entity('class_cancellation')
export class ClassCancellationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => CalendarEventEntity, { onDelete: 'CASCADE' })
  @Index({ unique: true })
  @JoinColumn({ name: 'event_id' })
  event!: CalendarEventEntity;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @CreateDateColumn({ type: 'timestamp' })
  cancelled_at!: Date;

  @ManyToOne(() => TeacherEntity, cancellationTeacher => cancellationTeacher.class_cancellations, {
    cascade: true,
  })
  teacher!: TeacherEntity;
}
