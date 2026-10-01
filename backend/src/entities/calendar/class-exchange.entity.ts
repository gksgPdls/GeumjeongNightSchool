import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index
} from 'typeorm';

import { CalendarEventEntity } from './calendar.entity';
import { TeacherEntity } from '../person.entity';

@Entity('class_exchange')
export class ClassExchangeEntity {
  @PrimaryGeneratedColumn()
  id! : number;

  @OneToMany(() => CalendarEventEntity, event => event.exchange, { cascade: true })
  events!: CalendarEventEntity[];

  @OneToMany(() => ClassExchangeParticipantEntity, participant => participant.exchange, { cascade: true })
  participants!: ClassExchangeParticipantEntity[];

  @Column({ type: 'text', nullable: true })
  reason?: string; 

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}

@Entity('class_exchange_participant')
@Index(['exchange_id', 'teacher_id'], { unique: true }) 
export class ClassExchangeParticipantEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  exchange_id!: number;

  @Column()
  teacher_id!: number;

  @ManyToOne(() => ClassExchangeEntity, exchange => exchange.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exchange_id' })
  exchange!: ClassExchangeEntity;

  @ManyToOne(() => TeacherEntity, teacher => teacher.exchangeParticipations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;
}
