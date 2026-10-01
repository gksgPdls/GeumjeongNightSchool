import { Injectable, Logger, NotFoundException, Inject,BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, In, QueryRunner, DeepPartial} from 'typeorm';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

import { ClassEntity } from '../../entities/class.entity';
import { TeacherAttendanceEntity, StudentAttendanceEntity} from '../../entities/person.entity';
import { CalendarEventEntity,  CalendarEventStudentEntity, CalendarEventTeacherEntity } from '../../entities/calendar/calendar.entity';
import { ClassCancellationEntity } from '../../entities/calendar/class-cancellation.entity';
import { CalendarEventDescriptionEntity} from '../../entities/calendar/calendar-description.entity'

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto, EventQueryPeriod } from './dto/event-query.dto';
import { EventResponseDto, EventDetailResponseDto } from './dto/event-response.dto';
import { EventForListDto } from './dto/event-for-list.dto';
import { EventDetailDto } from './dto/event-detail.dto';
import { MyEventQueryDto } from './dto/my-event-query.dto';

import { withRetry } from '../../common/utils/retry.util';

import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';
import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';
import { AttendanceStatus } from 'night_school_app_dev_libs/interface/attendance.interface';


@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly maxAttempts: number;
  private readonly retryDelay: number;

  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
    @InjectRepository(CalendarEventEntity)
    private eventRepository: Repository<CalendarEventEntity>,
    @InjectRepository(CalendarEventTeacherEntity)
    private calendarEventTeacherRepository: Repository<CalendarEventTeacherEntity>,
    @InjectRepository(CalendarEventStudentEntity)
    private calendarEventStudentRepository: Repository<CalendarEventStudentEntity>,
    @InjectRepository(StudentAttendanceEntity)
    private studentAttendanceRepository: Repository<StudentAttendanceEntity>,
    @InjectRepository(TeacherAttendanceEntity)
    private teacherAttendanceRepository: Repository<TeacherAttendanceEntity>,
    @InjectRepository(ClassCancellationEntity)
    private classCancellationRepository: Repository<ClassCancellationEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.maxAttempts = this.configService.get<number>('retry.maxAttempts') ?? 5;
    this.retryDelay = this.configService.get<number>('retry.delay') ?? 500;
  }

  async createEvent(dto: CreateEventDto): Promise<EventDetailDto> {
    return await withRetry(
      async () => {
        if (dto.event_type !== EventType.CLASS) {
          throw new BadRequestException(`This endpoint only supports creating CLASS events. Received: ${dto.event_type}`);
        }
        // 1. Start a transaction
        const queryRunner = this.eventRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        this.logger.log(`Starting transaction  to create a CLASS event for date: ${dto.event_date}`);
        try { 
          // 2. Create the main CalendarEventEntity and its description.
          // The description will be saved along with the event due to the cascade option on the entity relationship.
          const eventToCreate = this.eventRepository.create({
            event_date: new Date(dto.event_date),
            event_type: EventType.CLASS,
            class_type: dto.class_type,
            description: { // For a OneToOne relationship, provide the data as a nested object.
              description: dto.description,
            },
          });
          const savedEvent = await queryRunner.manager.save(eventToCreate);
          this.logger.log(`Saved main event, got event ID: ${savedEvent.id}`);
          // 3. Link teachers to the event and create their individual attenda  nce records.
          if (dto.teacher_ids && dto.teacher_ids.length > 0) {
            for (const teacherId of dto.teacher_ids) {
              // CalendarEventTeacherEntity: Link the event to a teacher.
              await queryRunner.manager.save(this.calendarEventTeacherRepository.create({
                event: savedEvent,
                teacher: { id: teacherId }, // When setting up relations, pass an object with the ID.
              }));
              // TeacherAttendanceEntity: Create a default attendance record for the teacher.
              await queryRunner.manager.save(this.teacherAttendanceRepository.create({
                teacher: { id: teacherId },
                event: savedEvent,
                status: AttendanceStatus.UNASSIGNED, // Default attendance status.
                event_type: EventType.CLASS,
                class_type: dto.class_type,
              }));
            }
            this.logger.log(`Linked ${dto.teacher_ids.length} teachers and created their attendance records.`);
          }
          // 4. Link students to the event and create their individual attendance records.
          if (dto.student_ids && dto.student_ids.length > 0) {
            for (const studentId of dto.student_ids) {
              await queryRunner.manager.save(this.calendarEventStudentRepository.create({
                event: savedEvent,
                student: { id: studentId },
              }));
              // StudentAttendanceEntity: Create a default attendance record for the student.
              await queryRunner.manager.save(this.studentAttendanceRepository.create({
                student: { id: studentId },
                event: savedEvent,
                status: AttendanceStatus.UNASSIGNED, // Default attendance status.
              }));
            }
            this.logger.log(`Linked ${dto.student_ids.length} students and created their attendance records.`);
          }
          // 5. If all operations succeed, commit the transaction.
          await queryRunner.commitTransaction();
          this.logger.log(`Transaction committed successfully for event ID: ${savedEvent.id}`);
          // 6. Invalidate relevant caches (utilizing existing logic).  
          await this.invalidateEventCaches(savedEvent.event_date);

          // 7. Return the created event object (more useful than a boolean).
          return this.getEventDetail(savedEvent.id);
        } catch (error) { 
          // 8. If an error occurs, roll back all changes.
          this.logger.error(`Error during event creation transaction. Rolling back...`, error.stack);
          await queryRunner.rollbackTransaction();
          // Re-throw the error to let NestJS generate the appropriate HTTP 500 response.
          throw new InternalServerErrorException('Failed to create event due to a database error.');
        } finally {
          // 9. Whether it succeeds or fails, release the query runner connection.
          await queryRunner.release();
        }
      },
      this.maxAttempts,
      this.retryDelay,
      this.logger,
      'createEvent'
    );
  }     

  async getMyEventsByPeriod(teacherId: number, queryDto: MyEventQueryDto): Promise<EventForListDto[]> {
    const { startDate, endDate } = this.calculateDateRange(queryDto);
    const cacheKey = `myEventsForList:${teacherId}:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}`;
    
    const cachedEvents = await this.cacheManager.get<EventForListDto[]>(cacheKey);
    if (cachedEvents) {
      this.logger.debug(`Cache hit for my event list for teacher ${teacherId}`);
      return cachedEvents;
    }

    const events = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoin('event.description', 'description')
      .leftJoin('event.teachers_event', 'event_teacher')
      .leftJoin('event_teacher.teacher', 'teacher')
      .leftJoin('event.students_event', 'event_student')
      .addSelect(['description.description'])
      .addSelect(['event_teacher.id', 'teacher.id', 'teacher.name'])
      .addSelect(['event_student.id'])
      
      .where('event.event_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('event_teacher.teacher_id = :teacherId', { teacherId })
      
      .orderBy('event.event_date', 'ASC')
      .getMany();

    const responseDtos = events.map(event => ({
      id: event.id,
      event_date: format(event.event_date, 'yyyy-MM-dd'),
      class_type: event.class_type,
      description: event.description.description,
      teachers: event.teachers_event.map(et => ({
        id: et.teacher.id,
        name: et.teacher.name,
      })),
      student_count: event.students_event.length,
    }));

    await this.cacheManager.set(cacheKey, responseDtos, 60 * 60); 
    return responseDtos;
  }

  async getEventsByPeriod(queryDto: EventQueryDto): Promise<EventForListDto[]> {
    const { startDate, endDate } = this.calculateDateRange(queryDto);
    const cacheKey = `eventsForList:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}`;
    
    const cachedEvents = await this.cacheManager.get<EventForListDto[]>(cacheKey);
    if (cachedEvents) {
      this.logger.debug(`Cache hit for event list period ${startDate} to ${endDate}`);
      return cachedEvents;
    }

    const events = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoin('event.description', 'description')
      .leftJoin('event.teachers_event', 'event_teacher')
      .leftJoin('event_teacher.teacher', 'teacher')
      .leftJoin('event.students_event', 'event_student')
      .addSelect(['description.description'])
      .addSelect(['event_teacher.id', 'teacher.id', 'teacher.name'])
      .addSelect(['event_student.id']) 
      .where('event.event_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('event.event_date', 'ASC')
      .getMany();

    const responseDtos = events.map(event => ({
      id: event.id,
      event_date: format(event.event_date, 'yyyy-MM-dd'),
      class_type: event.class_type,
      description: event.description.description,
      teachers: event.teachers_event.map(et => ({
        id: et.teacher.id,
        name: et.teacher.name,
      })),
      student_count: event.students_event.length,
    }));

    await this.cacheManager.set(cacheKey, responseDtos, 60 * 60); 
    return responseDtos;
  }

  async getEventDetail(id: number): Promise<EventDetailDto | null> {
    const cacheKey = `eventDetail:${id}`;
    const cachedEvent = await this.cacheManager.get<EventDetailDto>(cacheKey);
    if (cachedEvent) {
      this.logger.debug(`Cache hit for event detail with id ${id}`);
      return cachedEvent;
    }

    const event = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.id = :id', { id })
      .leftJoinAndSelect('event.description', 'description')
      .leftJoinAndSelect('event.teachers_event', 'event_teacher')
      .leftJoinAndSelect('event_teacher.teacher', 'teacher')
      .leftJoinAndSelect('event.teacher_attendances', 'teacher_attendance', 'teacher_attendance.teacher_id = teacher.id')
      .leftJoinAndSelect('event.students_event', 'event_student')
      .leftJoinAndSelect('event_student.student', 'student')
      .leftJoinAndSelect('event.student_attendances', 'student_attendance', 'student_attendance.student_id = student.id')
      .getOne();

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found.`);
    }

    const responseDto: EventDetailDto = {
      id: event.id,
      event_date: format(event.event_date, 'yyyy-MM-dd'),
      class_type: event.class_type,
      description: event.description.description,
      teachers: event.teachers_event.map(et => ({
        id: et.teacher.id,
        name: et.teacher.name,
        attendance_status: event.teacher_attendances.find(
          att => att.teacher_id === et.teacher.id
        )?.status || AttendanceStatus.UNASSIGNED,
      })),
      students: event.students_event.map(es => ({
        id: es.student.id,
        name: es.student.name,
        attendance_status: event.student_attendances.find(
          att => att.student_id === es.student.id
        )?.status || AttendanceStatus.UNASSIGNED,
      })),
    };
    
    await this.cacheManager.set(cacheKey, responseDto, 60 * 60);
    return responseDto;
  }


//------------------------------ TODO ------------------------------ 

  async updateEvent(id: number, dto: UpdateEventDto): Promise<EventDetailDto> {
    return await withRetry(async () => {
      const queryRunner = this.eventRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      this.logger.log(`Starting transaction to update event ID: ${id}`);

      try {
        // 1. Fetch the existing event with all its current relations
        const event = await queryRunner.manager.findOne(CalendarEventEntity, {
          where: { id },
          relations: [
            'description',
            'teachers_event',
            'teachers_event.teacher',
            'students_event',
            'students_event.student'
          ],
        });

        if (!event) {
          throw new NotFoundException(`Event with ID ${id} not found.`);
        }

        const originalTeacherIds = event.teachers_event.map(et => et.teacher.id);

        // 2. Update main event properties and its description
        event.class_type = dto.class_type;
        if (dto.description) {
            event.description.description = dto.description;
        }
        event.updated_at = new Date();
        await queryRunner.manager.save(event);
        
        // 3. Update Teachers and their Attendance records
        if (dto.teacher_ids) {
            await this.syncParticipants(
                queryRunner,
                event,
                dto.teacher_ids,
                'teacher',
                this.calendarEventTeacherRepository,
                this.teacherAttendanceRepository
            );
        }

        // 4. Update Students and their Attendance records
        if (dto.student_ids) {
            await this.syncParticipants(
                queryRunner,
                event,
                dto.student_ids,
                'student',
                this.calendarEventStudentRepository,
                this.studentAttendanceRepository
            );
        }
        
        // 5. Commit transaction and invalidate caches
        await queryRunner.commitTransaction();
        this.logger.log(`Transaction committed for event update ID: ${id}`);
        
        const allAffectedTeacherIds = [...new Set([...originalTeacherIds, ...(dto.teacher_ids || [])])];
        await this.invalidateRelatedCaches(event.id, event.event_date, allAffectedTeacherIds);

        return this.getEventDetail(id);

      } catch (error) {
        this.logger.error(`Error during event update transaction for ID: ${id}. Rolling back...`, error.stack);
        await queryRunner.rollbackTransaction();
        if (error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException('Failed to update event due to a database error.');
      } finally {
        await queryRunner.release();
      }
    }, this.maxAttempts, this.retryDelay, this.logger, 'updateEvent');
  }


  async deleteEvent(id: number): Promise<{ success: boolean }> {
    return await withRetry(async () => {
      const queryRunner = this.eventRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      this.logger.log(`Starting transaction to delete event ID: ${id}`);

      try {
        // 1. Find the event to be deleted, including relations needed for cache invalidation.
        const event = await queryRunner.manager.findOne(CalendarEventEntity, {
            where: { id },
            relations: ['teachers_event', 'teachers_event.teacher']
        });

        if (!event) {
          throw new NotFoundException(`Event with ID ${id} to delete was not found.`);
        }
        
        const eventDate = event.event_date;
        const teacherIds = event.teachers_event.map(et => et.teacher.id);

        // 2. To ensure clean deletion, first remove all dependent attendance records.
        // This is safer than relying solely on cascades from the CalendarEvent side.
        await queryRunner.manager.delete(TeacherAttendanceEntity, { event: { id } });
        await queryRunner.manager.delete(StudentAttendanceEntity, { event: { id } });

        // 3. Now, remove the event. If entities have `cascade: true` for relations
        // like `teachers_event`, `students_event`, and `description`, TypeORM handles their removal.
        // If not, they would need to be deleted manually here before removing the event itself.
        await queryRunner.manager.remove(event);

        // 4. Commit the transaction
        await queryRunner.commitTransaction();
        this.logger.log(`Transaction committed for event deletion ID: ${id}`);

        // 5. Invalidate all related caches
        await this.invalidateRelatedCaches(id, eventDate, teacherIds);

        return { success: true };
      } catch (error) {
        this.logger.error(`Error during event deletion transaction for ID: ${id}. Rolling back...`, error.stack);
        await queryRunner.rollbackTransaction();
        if (error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException('Failed to delete event due to a database error.');
      } finally {
        await queryRunner.release();
      }
    }, this.maxAttempts, this.retryDelay, this.logger, 'deleteEvent');
  }



  private async syncParticipants<P, A>(
    queryRunner: QueryRunner,
    event: CalendarEventEntity,
    newIds: number[],
    participantType: 'teacher' | 'student',
    participantRepo: Repository<P>,
    attendanceRepo: Repository<A>
  ): Promise<void> {
    const linkKey = `${participantType}s_event`; // e.g., 'teachers_event'
    
    const currentLinks = event[linkKey] || [];
    const currentIds = currentLinks.map(link => link[participantType].id);
    
    const idsToAdd = newIds.filter(id => !currentIds.includes(id));
    const idsToRemove = currentIds.filter(id => !newIds.includes(id));

    // Remove participants who are no longer in the event
    if (idsToRemove.length > 0) {
      this.logger.log(`Removing ${idsToRemove.length} ${participantType}(s) from event ${event.id}`);
      await queryRunner.manager.delete(participantRepo.target, { event: { id: event.id }, [participantType]: { id: In(idsToRemove) } });
      await queryRunner.manager.delete(attendanceRepo.target, { event: { id: event.id }, [participantType]: { id: In(idsToRemove) } });
    }

    // Add new participants to the event
    if (idsToAdd.length > 0) {
      this.logger.log(`Adding ${idsToAdd.length} ${participantType}(s) to event ${event.id}`);
      for (const participantId of idsToAdd) {
        // Create link entity
        const newLink = participantRepo.create({
          event,
          [participantType]: { id: participantId },
        } as DeepPartial<P>);
        await queryRunner.manager.save(newLink);

        // Create corresponding attendance record
        const newAttendance = attendanceRepo.create({
          event,
          [participantType]: { id: participantId },
          status: AttendanceStatus.UNASSIGNED,
          ...(participantType === 'teacher' && { event_type: EventType.CLASS, class_type: event.class_type })
        } as DeepPartial<A>); // Asserting here as well for consistency and safety
        await queryRunner.manager.save(newAttendance);
      }
    }
  }

  private calculateDateRange(queryDto: EventQueryDto): { startDate: Date; endDate: Date } {
    const today = new Date();
    
    switch (queryDto.period) {
      case EventQueryPeriod.THREE_MONTHS: {
        const currentMonth = today.getMonth();
        return {
          startDate: new Date(today.getFullYear(), currentMonth - 1, 1),
          endDate: new Date(today.getFullYear(), currentMonth + 2, 0)
        };
      }
      case EventQueryPeriod.ONE_MONTH: {
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        };
      }
      case EventQueryPeriod.ONE_WEEK: {
        const dayOfWeek = today.getDay();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (6 - dayOfWeek));
        return { startDate, endDate };
      }
      case EventQueryPeriod.ONE_DAY: {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return { startDate: date, endDate: date };
      }
      default:
        throw new Error('Unsupported period');
    }
  }

  private async invalidateRelatedCaches(eventId: number, eventDate: Date, teacherIds: number[]): Promise<void> {
    // 1. Invalidate the detailed view cache for this specific event
    const detailCacheKey = `eventDetail:${eventId}`;
    await this.cacheManager.del(detailCacheKey);
    this.logger.debug(`Invalidated cache: ${detailCacheKey}`);

    // 2. Invalidate list caches. This is complex because the date range can vary.
    // A pragmatic approach is to clear caches for the month of the event, as
    // one-month and three-month queries are common and will be affected.
    const monthStart = startOfMonth(eventDate);
    const monthEnd = endOfMonth(eventDate);
    const listCacheKey = `eventsForList:${format(monthStart, 'yyyy-MM-dd')}:${format(monthEnd, 'yyyy-MM-dd')}`;
    await this.cacheManager.del(listCacheKey);
    this.logger.debug(`Invalidated cache: ${listCacheKey}`);

    // 3. Invalidate the "My Events" cache for every teacher involved
    if (teacherIds && teacherIds.length > 0) {
        for (const teacherId of teacherIds) {
            const myEventsCacheKey = `myEventsForList:${teacherId}:${format(monthStart, 'yyyy-MM-dd')}:${format(monthEnd, 'yyyy-MM-dd')}`;
            await this.cacheManager.del(myEventsCacheKey);
            this.logger.debug(`Invalidated cache: ${myEventsCacheKey}`);
        }
    }
  }

  // 캐싱 구조 하루 단위로 하면 안될 것 같은데
  // 이벤트 단위 캐싱을 하고 메타 캐싱으로 묶어서 하는게 좋지 않을까
  private async invalidateDailyCache(eventDate: Date): Promise<void> {
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    const cacheKey = `events:${dateKey}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Daily cache invalidated for date: ${dateKey}`);
  }
  
  private async invalidateMonthCache(eventDate: Date): Promise<void> {
    const firstDay = startOfMonth(eventDate);
    const lastDay = endOfMonth(eventDate);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  
    for (const day of days) {
      const dateKey = format(day, 'yyyy-MM-dd'); // "YYYY-MM-DD" 형식의 날짜 문자열
      const cacheKey = `events:${dateKey}`;
      await this.cacheManager.del(cacheKey);
      this.logger.debug(`Monthly cache invalidated for date: ${dateKey}`);
    }
  }
  
  private async invalidateRangeCache(eventDate: Date): Promise<void> {
    for (let offset = -1; offset <= 1; offset++) {
      const targetDate = new Date(eventDate.getFullYear(), eventDate.getMonth() + offset, 1);
      await this.invalidateMonthCache(targetDate);
    }
  }
  
  public async invalidateEventCaches(eventDate: Date): Promise<void> {
    await this.invalidateDailyCache(eventDate);
    await this.invalidateMonthCache(eventDate);
    await this.invalidateRangeCache(eventDate);
    this.logger.debug(`All caches invalidated for event date: ${eventDate.toISOString()}`);
  }

}