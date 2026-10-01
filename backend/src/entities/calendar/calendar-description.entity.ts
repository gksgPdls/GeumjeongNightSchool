import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
} from 'typeorm';

import {
  CalendarEventEntity,
  CalendarSpecialEventEntity
}from './calendar.entity';

@Entity('calendar_event_descriptions') 
export class CalendarEventDescriptionEntity {
@PrimaryGeneratedColumn()
id!: number;

@Column({ type: 'text' })
description!: string;

@OneToOne(() => CalendarEventEntity, event => event.description)
event!: CalendarEventEntity;
}

@Entity('calendar_special_event_descriptions') 
export class CalendarSpecialEventDescriptionEntity {
@PrimaryGeneratedColumn()
id!: number;

@Column({ type: 'text' })
description!: string;

@OneToOne(() => CalendarSpecialEventEntity, event => event.description)
event!: CalendarSpecialEventEntity;
}
