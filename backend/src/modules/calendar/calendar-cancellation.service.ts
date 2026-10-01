// src/modules/calendar/calendar-cancellation.service.ts

import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { CalendarEventEntity } from '../../entities/calendar/calendar.entity';
import { ClassCancellationEntity } from '../../entities/calendar/class-cancellation.entity';
import { StudentAttendanceEntity, TeacherAttendanceEntity, TeacherEntity } from '../../entities/person.entity';
import { CancelClassDto } from './dto/cancellation-class.dto';
import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';
import { AttendanceStatus } from 'night_school_app_dev_libs/interface/attendance.interface';
import { withRetry } from '../../common/utils/retry.util';

@Injectable()
export class CalendarCancellationService {
  private readonly logger = new Logger(CalendarCancellationService.name);
  private readonly maxAttempts: number = 3;
  private readonly retryDelay: number = 1000;

  constructor(
    @InjectRepository(CalendarEventEntity)
    private readonly eventRepository: Repository<CalendarEventEntity>,
    @InjectRepository(ClassCancellationEntity)
    private readonly cancellationRepository: Repository<ClassCancellationEntity>,
    @InjectRepository(StudentAttendanceEntity)
    private readonly studentAttendanceRepository: Repository<StudentAttendanceEntity>,
    @InjectRepository(TeacherAttendanceEntity)
    private readonly teacherAttendanceRepository: Repository<TeacherAttendanceEntity>,
    private readonly connection: Connection,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async cancelClass(cancelDto: CancelClassDto): Promise<ClassCancellationEntity> {
    return await withRetry(async () => {
      const { event_id, teacher_id, cancellation_reason } = cancelDto;

      const queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const event = await queryRunner.manager.findOne(CalendarEventEntity, {
          where: { id: event_id },
          relations: ['teachers_event', 'teachers_event.teacher'], // 엔티티 관계명 수정
        });

        if (!event) {
          throw new NotFoundException(`Event with ID ${event_id} not found.`);
        }
        if (event.event_type !== EventType.CLASS) {
          throw new BadRequestException(`Event ${event_id} is not a class event and cannot be cancelled.`);
        }

        const isTeacherAuthorized = event.teachers_event.some(t => t.teacher_id === teacher_id);
        if (!isTeacherAuthorized) {
          throw new BadRequestException(`Teacher ${teacher_id} is not assigned to this event.`);
        }
        
        const existingCancellation = await queryRunner.manager.findOne(ClassCancellationEntity, { where: { event: { id: event_id } } });
        if (existingCancellation) {
            throw new BadRequestException(`Event ${event_id} has already been cancelled.`);
        }

        await queryRunner.manager.update(TeacherAttendanceEntity, 
            { event: { id: event_id } }, 
            { status: AttendanceStatus.CANCELLED }
        );
        await queryRunner.manager.update(StudentAttendanceEntity, 
            { event: { id: event_id } }, 
            { status: AttendanceStatus.CANCELLED }
        );

        const cancellation = this.cancellationRepository.create({
            event: event,
            teacher: { id: teacher_id } as TeacherEntity, // 관계형으로 할당
            cancellation_reason: cancellation_reason,
        });
        const savedCancellation = await queryRunner.manager.save(cancellation);
        
        await queryRunner.commitTransaction();
        this.logger.log(`Class ${event_id} has been successfully cancelled by teacher ${teacher_id}`);

        const teacherIds = event.teachers_event.map(t => t.teacher.id);
        await this.invalidateEventCaches(event.id, event.event_date, teacherIds);

        return savedCancellation;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Failed to cancel class for event ${event_id}:`, error);
        throw error;
      } finally {
        await queryRunner.release();
      }
    }, this.maxAttempts, this.retryDelay, this.logger, 'cancelClass');
  }

  
  private async invalidateEventCaches(eventId: number, eventDate: Date, teacherIds: number[]): Promise<void> {
    const detailCacheKey = `eventDetail:${eventId}`;
    await this.cacheManager.del(detailCacheKey);
    this.logger.debug(`Invalidated cache: ${detailCacheKey}`);

    const monthStart = startOfMonth(eventDate);
    const monthEnd = endOfMonth(eventDate);
    const listCacheKey = `eventsForList:${format(monthStart, 'yyyy-MM-dd')}:${format(monthEnd, 'yyyy-MM-dd')}`;
    await this.cacheManager.del(listCacheKey);
    this.logger.debug(`Invalidated cache: ${listCacheKey}`);

    if (teacherIds && teacherIds.length > 0) {
        for (const teacherId of teacherIds) {
            const myEventsCacheKey = `myEventsForList:${teacherId}:${format(monthStart, 'yyyy-MM-dd')}:${format(monthEnd, 'yyyy-MM-dd')}`;
            await this.cacheManager.del(myEventsCacheKey);
            this.logger.debug(`Invalidated cache: ${myEventsCacheKey}`);
        }
    }
  }
}