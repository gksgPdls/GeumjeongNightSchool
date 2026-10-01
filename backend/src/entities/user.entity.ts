import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToOne, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { TeacherEntity, StudentEntity} from './person.entity';


export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role: UserRole;

  @Column({ nullable: true })
  teacher_id?: number;

  @Column({ nullable: true })
  student_id?: number;

  @OneToOne(() => TeacherEntity, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: TeacherEntity;

  @OneToOne(() => StudentEntity, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: StudentEntity;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}