import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, In } from 'typeorm'; // In 추가 (필요시 사용)
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
  TeacherEntity,
  StudentEntity,
  TeacherClassScheduleEntity,
  StudentClassScheduleEntity,
  StudentAttendanceEntity,
  TeacherAttendanceEntity,
} from '../../entities/person.entity';

import {
  CalendarEventEntity,
  CalendarEventStudentEntity,
  CalendarEventTeacherEntity,
  CalendarSpecialEventEntity,
} from '../../entities/calendar/calendar.entity';

import { ClassExchangeEntity } from '../../entities/calendar/class-exchange.entity';
import { ClassCancellationEntity } from '../../entities/calendar/class-cancellation.entity';

import {
  CalendarEventDescriptionEntity,
} from '../../entities/calendar/calendar-description.entity';
import { VolunteerHistoryEntity } from '../../entities/volunteer-history.entity';
import { ClassEntity } from '../../entities/class.entity';
import { DivisionEntity, TeacherDivisionMembershipEntity, TeacherDivisionLevel } from '../../entities/division.entity';

import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';
import { AttendanceStatus } from 'night_school_app_dev_libs/interface/attendance.interface';
import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';
import { VolunteerStatus } from 'night_school_app_dev_libs/interface/volunteer-history.interface';

interface ClassInitData {
  class_type: ClassType; 
  name: string;
  subjects?: string[];
  class_goals?: string[];
}

interface ScheduleData {
  class_type: ClassType;
  day_of_week: number;
}

interface PersonData {
  name: string;
  phone_number?: string;
  birth_date: string;
  created_at: string;
  updated_at: string;
  started_at: string;
  finished_at: string;
  division_name?: string; 
  schedules: ScheduleData[];
}

interface InitialData {
  teachers: PersonData[];
  students: PersonData[];
  classes?: ClassInitData[]; 
}

const DEFAULT_VOLUNTEER_HOURS = 3.0; 

@Injectable()
export class DatabaseInitializerService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitializerService.name);

  constructor(
    private readonly connection: Connection,
    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    @InjectRepository(TeacherClassScheduleEntity)
    private readonly teacherScheduleRepository: Repository<TeacherClassScheduleEntity>,
    @InjectRepository(StudentClassScheduleEntity)
    private readonly studentScheduleRepository: Repository<StudentClassScheduleEntity>,
    @InjectRepository(CalendarEventEntity)
    private readonly calendarEventRepository: Repository<CalendarEventEntity>,
    @InjectRepository(CalendarEventTeacherEntity)
    private readonly calendarEventTeacherRepository: Repository<CalendarEventTeacherEntity>,
    @InjectRepository(CalendarEventStudentEntity)
    private readonly calendarEventStudentRepository: Repository<CalendarEventStudentEntity>,
    @InjectRepository(StudentAttendanceEntity)
    private readonly studentAttendanceRepository: Repository<StudentAttendanceEntity>,
    @InjectRepository(TeacherAttendanceEntity)
    private readonly teacherAttendanceRepository: Repository<TeacherAttendanceEntity>,
    @InjectRepository(VolunteerHistoryEntity)
    private readonly volunteerHistoryRepository: Repository<VolunteerHistoryEntity>,
    @InjectRepository(DivisionEntity)
    private readonly divisionRepository: Repository<DivisionEntity>,
    @InjectRepository(TeacherDivisionMembershipEntity)
    private readonly teacherDivisionMembershipRepository: Repository<TeacherDivisionMembershipEntity>,
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
  ) {}

  async onModuleInit() {
    const teacherCount = await this.teacherRepository.count();
    if (teacherCount === 0) { 
      this.logger.log('Database appears to be empty. Initializing with all data...');
      await this.initializeCoreEntities();
      await this.initializePeopleAndSchedules();
      await this.generateLessonEventsAndVolunteerHistory();
      this.logger.log('Database initialization complete. ✅');
    } else {
      this.logger.log('Database already contains teacher data. Skipping initialization. ℹ️');
    }
  }

  private async initializeCoreEntities() {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      this.logger.log('Step 1: Initializing Core Entities (Divisions, Classes)...');

      const defaultDivisionName = "Main Division";
      let mainDivision = await queryRunner.manager.findOne(DivisionEntity, { where: { name: defaultDivisionName } });
      if (!mainDivision) {
        mainDivision = await queryRunner.manager.save(
          queryRunner.manager.create(DivisionEntity, {
            name: defaultDivisionName,
            description: 'Default main division for initial data',
          }),
        );
        this.logger.log(`Created default division: "${mainDivision.name}" (ID: ${mainDivision.id})`);
      } else {
        this.logger.log(`Default division "${mainDivision.name}" (ID: ${mainDivision.id}) already exists.`);
      }

      const filePath = path.join(process.cwd(), 'data', 'initial-data.json');
      const dataBuffer = await fs.readFile(filePath, 'utf-8');
      const initialJsonData: InitialData = JSON.parse(dataBuffer);

      let classesCreatedCount = 0;
      if (initialJsonData.classes && initialJsonData.classes.length > 0) {
        this.logger.log(`Found ${initialJsonData.classes.length} class definitions in initial-data.json.`);
        for (const classData of initialJsonData.classes) {
          let classEntity = await queryRunner.manager.findOne(ClassEntity, { where: { class_type: classData.class_type } });
          if (!classEntity) {
            classEntity = await queryRunner.manager.save(
              queryRunner.manager.create(ClassEntity, {
                class_type: classData.class_type,
                name: classData.name,
                subjects: classData.subjects || [], 
                class_goals: classData.class_goals || [], 
              }),
            );
            this.logger.log(`Created ClassEntity: Type - ${classData.class_type}, Name - "${classEntity.name}"`);
            classesCreatedCount++;
          } else {
            this.logger.log(`ClassEntity for type ${classData.class_type} (Name: "${classEntity.name}") already exists. Skipping creation.`);
          }
        }
      } else {
        this.logger.warn('No explicit class definitions found in initial-data.json ([classes] array is missing or empty). ' +
                         'Consider adding class definitions for more detailed initialization.');
      }
      
      if (classesCreatedCount > 0) {
        this.logger.log(`${classesCreatedCount} new ClassEntities created from explicit definitions.`);
      }

      await queryRunner.commitTransaction();
      this.logger.log('Core entities (Divisions, Classes) initialized successfully. 👍');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to initialize core entities 💣', error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async initializePeopleAndSchedules() {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      this.logger.log('Step 2: Initializing People (Teachers, Students) and their Schedules/Memberships...');
      const filePath = path.join(process.cwd(), 'data', 'initial-data.json');
      const dataBuffer = await fs.readFile(filePath, 'utf-8');
      const data: InitialData = JSON.parse(dataBuffer);

      for (const teacherData of data.teachers) {
        const { schedules, division_name, ...teacherInfo } = teacherData;
        
        const teacherToSave = this.teacherRepository.create({
            ...teacherInfo, 
            birth_date: new Date(teacherData.birth_date), 
            created_at: new Date(teacherData.created_at),
            updated_at: new Date(teacherData.updated_at),
            started_at: new Date(teacherData.started_at),
            finished_at: new Date(teacherData.finished_at),
        });
        const teacher = await queryRunner.manager.save(TeacherEntity, teacherToSave);

        if (division_name) {
          const divisionEntity = await queryRunner.manager.findOne(DivisionEntity, { where: { name: division_name } });
          if (divisionEntity) {
            await queryRunner.manager.save(
              queryRunner.manager.create(TeacherDivisionMembershipEntity, {
                teacher_id: teacher.id,
                division_id: divisionEntity.id,
                is_primary: true, // 주 부서로 가정
                level: TeacherDivisionLevel.MEMBER, // 기본 레벨로 가정
              }),
            );
            this.logger.log(`Teacher "${teacher.name}" assigned to division "${division_name}" (ID: ${divisionEntity.id}).`);
          } else {
            this.logger.warn(`Division with name "${division_name}" not found for teacher "${teacher.name}". Teacher will not be assigned to this division. Ensure this division is created in initializeCoreEntities or initial-data.json.`);
          }
        } else {
            this.logger.log(`No division specified for teacher "${teacher.name}".`);
        }

        const scheduleEntities = schedules.map(schedule => 
          this.teacherScheduleRepository.create({
            teacher_id: teacher.id,
            class_type: schedule.class_type,
            day_of_week: schedule.day_of_week,
          }),
        );
        if (scheduleEntities.length > 0) {
            await queryRunner.manager.save(TeacherClassScheduleEntity, scheduleEntities);
        }
      }
      this.logger.log(`${data.teachers.length} teachers, their division memberships (if any), and schedules initialized.`);

      for (const studentData of data.students) {
        const { schedules, ...studentInfo } = studentData;
        
        const studentToSave = this.studentRepository.create({
            ...studentInfo,
            birth_date: new Date(studentData.birth_date),
            created_at: new Date(studentData.created_at),
            updated_at: new Date(studentData.updated_at),
            started_at: new Date(studentData.started_at),
            finished_at: new Date(studentData.finished_at),
        });
        const student = await queryRunner.manager.save(StudentEntity, studentToSave);

        const scheduleEntities = schedules.map(schedule => 
          this.studentScheduleRepository.create({
            student_id: student.id,
            class_type: schedule.class_type,
            day_of_week: schedule.day_of_week,
          }),
        );
        if (scheduleEntities.length > 0) {
            await queryRunner.manager.save(StudentClassScheduleEntity, scheduleEntities);
        }
      }
      this.logger.log(`${data.students.length} students and their schedules initialized.`);
      
      await queryRunner.commitTransaction();
      this.logger.log('People and schedules initialized successfully. 👍');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to initialize people/schedules data 💣', error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateLessonEventsAndVolunteerHistory() {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Step 3: Generating Lesson Events and Volunteer History...');
      const now = new Date();
      const startDate = startOfMonth(addMonths(now, -1)); 
      const endDate = endOfMonth(addMonths(now, 1));   
      this.logger.log(`Generating events from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      let eventsCreatedCount = 0;
      let volunteerHistoryCreatedCount = 0;
      let teacherAttendanceCreatedCount = 0;
      let studentAttendanceCreatedCount = 0;

      for (const day of days) {
        const dayOfWeek = day.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday

        const teacherSchedules = await queryRunner.manager.find(TeacherClassScheduleEntity, {
          where: { day_of_week: dayOfWeek },
          relations: ['teacher'], 
        });

        for (const schedule of teacherSchedules) {
          if (!schedule.teacher) {
            this.logger.warn(`Teacher not found for schedule ID ${schedule.id}. Skipping event generation.`);
            continue;
          }

          const eventDescription = queryRunner.manager.create(CalendarEventDescriptionEntity, {
            description: `${schedule.teacher.name} 선생님의 ${schedule.class_type} 수업`,
          });

          const eventToSave = queryRunner.manager.create(CalendarEventEntity, {
            event_date: day,
            event_type: EventType.CLASS,
            class_type: schedule.class_type,
            description: eventDescription, 
          });
          const savedEvent = await queryRunner.manager.save(CalendarEventEntity, eventToSave);
          eventsCreatedCount++;

          const volunteerHistoryToSave = queryRunner.manager.create(VolunteerHistoryEntity, {
            teacher_id: schedule.teacher.id,
            calendar_event_id: savedEvent.id, 
            event_type: savedEvent.event_type,
            volunteer_date: savedEvent.event_date,
            hours_volunteered: DEFAULT_VOLUNTEER_HOURS,
            description: `수업 진행: ${schedule.class_type}`,
            status: VolunteerStatus.PENDING, 
          });
          await queryRunner.manager.save(VolunteerHistoryEntity, volunteerHistoryToSave);
          volunteerHistoryCreatedCount++;
          
          savedEvent.volunteer_history = volunteerHistoryToSave; 
          await queryRunner.manager.save(CalendarEventEntity, savedEvent); 


          await queryRunner.manager.save(
            queryRunner.manager.create(CalendarEventTeacherEntity, {
              event_id: savedEvent.id,
              teacher_id: schedule.teacher.id,
            }),
          );

          await queryRunner.manager.save(
            queryRunner.manager.create(TeacherAttendanceEntity, {
              teacher_id: schedule.teacher.id,
              event_id: savedEvent.id,
              status: AttendanceStatus.UNASSIGNED,
              event_type: savedEvent.event_type,
            }),
          );
          teacherAttendanceCreatedCount++;

          const studentSchedules = await queryRunner.manager.find(StudentClassScheduleEntity, {
            where: { class_type: schedule.class_type, day_of_week: dayOfWeek },
            relations: ['student'],
          });

          for (const studentSchedule of studentSchedules) {
            if (!studentSchedule.student) {
                this.logger.warn(`Student not found for schedule ID ${studentSchedule.id}. Skipping student linking for event ID ${savedEvent.id}.`);
                continue;
            }
            await queryRunner.manager.save(
              queryRunner.manager.create(CalendarEventStudentEntity, {
                event_id: savedEvent.id,
                student_id: studentSchedule.student.id,
              }),
            );
            await queryRunner.manager.save(
              queryRunner.manager.create(StudentAttendanceEntity, {
                student_id: studentSchedule.student.id,
                event_id: savedEvent.id,
                status: AttendanceStatus.UNASSIGNED,
                class_type: schedule.class_type,
              }),
            );
            studentAttendanceCreatedCount++;
          }
        }
      }
      await queryRunner.commitTransaction();
      this.logger.log(`Lesson events and related data generation successful. 👍`);
      this.logger.log(`  - Events Created: ${eventsCreatedCount}`);
      this.logger.log(`  - Volunteer Histories Created: ${volunteerHistoryCreatedCount}`);
      this.logger.log(`  - Teacher Attendances Created: ${teacherAttendanceCreatedCount}`);
      this.logger.log(`  - Student Attendances Created: ${studentAttendanceCreatedCount}`);

      if (eventsCreatedCount > 0) {
        this.logger.log('Verification step: Check CalendarEvent, VolunteerHistory, and Attendance tables. 🧐');
      } else {
        this.logger.warn('No lesson events were generated. This might be normal if no schedules fall within the generated date range, or it could indicate an issue with schedule data. ⚠️');
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to generate lesson events and volunteer history 💣', error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}