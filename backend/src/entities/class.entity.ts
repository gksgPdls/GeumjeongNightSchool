import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TeacherClassScheduleEntity } from './person.entity';
import { StudentStatusEntity } from './study/student-status.entity';

import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';


@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_class_type')
  @Column({
    type: 'enum',
    enum: ClassType,
    default: ClassType.UNKNOWN
  })
  class_type!: ClassType;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  subjects?: string[];

  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  class_goals?: string[];

  @OneToMany(() => TeacherClassScheduleEntity, schedule => schedule.class)
  teacherSchedules!: TeacherClassScheduleEntity[];

  @OneToMany(() => StudentStatusEntity, status => status.class)
  studentEnrollments?: StudentStatusEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}