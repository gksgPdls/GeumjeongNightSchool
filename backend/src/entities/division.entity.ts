import { Entity, PrimaryGeneratedColumn, Column, OneToMany,
         ManyToOne, JoinColumn, Index
 } from 'typeorm';


import { TeacherEntity } from './person.entity'; // 경로 주의


export enum TeacherDivisionLevel {
    UNAFFILIATED = 1, 
    MEMBER = 2,       
    HEAD = 3          
  }

@Entity('divisions')
export class DivisionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string; 

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => TeacherDivisionMembershipEntity, membership => membership.division)
  memberships: TeacherDivisionMembershipEntity[];
}

@Entity('teacher_division_memberships')
@Index(['teacher_id', 'division_id'], { unique: true }) 
export class TeacherDivisionMembershipEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_tdm_teacher_id')
  @Column()
  teacher_id!: number;

  @Index('idx_tdm_division_id')
  @Column()
  division_id!: number;

  @Column({ type: 'boolean', default: false })
  is_primary!: boolean;

  @Index('idx_tdm_level') 
  @Column({
    type: 'enum',
    enum: TeacherDivisionLevel,
    default: TeacherDivisionLevel.UNAFFILIATED,
  })
  level!: TeacherDivisionLevel;

  @ManyToOne(() => TeacherEntity, teacher => teacher.division_memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherEntity;

  @ManyToOne(() => DivisionEntity, division => division.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'division_id' })
  division!: DivisionEntity;
}