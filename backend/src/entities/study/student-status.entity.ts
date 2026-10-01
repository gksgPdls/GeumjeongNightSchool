import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { StudentEntity } from '../person.entity'; 
  import { ClassEntity } from '../class.entity';  
  
  @Entity('student_statuses')
  @Index(['student_id', 'class_id'], { unique: true })
  export class StudentStatusEntity {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column()
    student_id!: number; 
  
    @Column()
    class_id!: number; 

    @Column({
      type: 'decimal', 
      precision: 5,    
      scale: 2,        
      nullable: true,  
    })
    attendance_rate?: number;
  
    @Column({ type: 'text', nullable: true })
    personal_goal?: string; 

    @Column({ type: 'varchar', length: 50, nullable: true })
    academic_level?: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date; 
  
    @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'student_id' })
    student!: StudentEntity;
  
    @ManyToOne(() => ClassEntity, classEntity => classEntity.studentEnrollments, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'class_id' })
    class!: ClassEntity; 
  }