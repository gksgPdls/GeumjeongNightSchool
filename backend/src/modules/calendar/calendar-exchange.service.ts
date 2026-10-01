// src/modules/calendar/calendar-exchange.service.ts

import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { CalendarEventEntity, CalendarEventTeacherEntity } from '../../entities/calendar/calendar.entity';
import { ClassExchangeEntity } from '../../entities/calendar/class-exchange.entity';
import { TeacherAttendanceEntity } from '../../entities/person.entity';

import { ExchangeClassDto } from './dto/exchange-class.dto';
import { withRetry } from '../../common/utils/retry.util';
import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';

@Injectable()
export class CalendarExchangeService {
  private readonly logger = new Logger(CalendarExchangeService.name);
  private readonly maxAttempts: number = 3;
  private readonly retryDelay: number = 1000;

  constructor(
    @InjectRepository(CalendarEventEntity)
    private readonly eventRepository: Repository<CalendarEventEntity>,
    @InjectRepository(CalendarEventTeacherEntity)
    private readonly eventTeacherRepository: Repository<CalendarEventTeacherEntity>,
    @InjectRepository(TeacherAttendanceEntity)
    private readonly teacherAttendanceRepository: Repository<TeacherAttendanceEntity>,
    @InjectRepository(ClassExchangeEntity)
    private readonly exchangeRepository: Repository<ClassExchangeEntity>,
    private readonly connection: Connection,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async swapTeachers(swapDto: ExchangeClassDto): Promise<ClassExchangeEntity> {
    return await withRetry(async () => {
      const { event_id1, teacher_id1, event_id2, teacher_id2 } = swapDto;

      const queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. 필요한 엔티티들을 모두 조회
        const [event1, event2] = await Promise.all([
            queryRunner.manager.findOne(CalendarEventEntity, { where: { id: event_id1 }, relations: ['teachers_event.teacher'] }),
            queryRunner.manager.findOne(CalendarEventEntity, { where: { id: event_id2 }, relations: ['teachers_event.teacher'] })
        ]);

        if (!event1 || !event2) throw new NotFoundException('One or both events not found');
        if (event1.event_type !== EventType.CLASS || event2.event_type !== EventType.CLASS) {
          throw new BadRequestException('Teacher exchange is only possible for class events');
        }

        const [assignment1, assignment2, attendance1, attendance2] = await Promise.all([
            queryRunner.manager.findOne(CalendarEventTeacherEntity, { where: { event_id: event_id1, teacher_id: teacher_id1 } }),
            queryRunner.manager.findOne(CalendarEventTeacherEntity, { where: { event_id: event_id2, teacher_id: teacher_id2 } }),
            queryRunner.manager.findOne(TeacherAttendanceEntity, { where: { calendar_event_id: event_id1, teacher_id: teacher_id1 } }),
            queryRunner.manager.findOne(TeacherAttendanceEntity, { where: { calendar_event_id: event_id2, teacher_id: teacher_id2 } })
        ]);

        if (!assignment1 || !assignment2) throw new BadRequestException('Teacher assignments do not match the events');
        if (!attendance1 || !attendance2) throw new BadRequestException('Could not find attendance records for one or both teachers.');
        
        // 2. 보강(Exchange) 기록 생성
        const exchange = this.exchangeRepository.create({
            reason: `Teacher swap between event ${event_id1} (Teacher ${teacher_id1}) and event ${event_id2} (Teacher ${teacher_id2}).`,
            participants: [
                { teacher_id: teacher_id1 },
                { teacher_id: teacher_id2 }
            ],
            events: [event1, event2]
        });
        const savedExchange = await queryRunner.manager.save(exchange);

        // 3. 담당 강사 정보(assignment)와 출결 기록(attendance)의 강사 ID를 교체
        assignment1.teacher_id = teacher_id2;
        attendance1.teacher_id = teacher_id2;

        assignment2.teacher_id = teacher_id1;
        attendance2.teacher_id = teacher_id1;
        
        // 4. 이벤트 정보 업데이트 (updated_at, exchange_id)
        const now = new Date();
        event1.updated_at = now;
        event2.updated_at = now;
        event1.exchange = savedExchange;
        event2.exchange = savedExchange;

        await Promise.all([
            queryRunner.manager.save([assignment1, assignment2]),
            queryRunner.manager.save([attendance1, attendance2]),
            queryRunner.manager.save([event1, event2])
        ]);

        await queryRunner.commitTransaction();
        this.logger.log(`Successfully swapped teachers and attendance between events ${event_id1} and ${event_id2}`);

        // 5. 관련 캐시 무효화 (두 이벤트 모두)
        const allTeacherIds1 = event1.teachers_event.map(t => t.teacher.id);
        const allTeacherIds2 = event2.teachers_event.map(t => t.teacher.id);
        
        await this.invalidateEventCaches(event1.id, event1.event_date, [...allTeacherIds1, teacher_id2]);
        await this.invalidateEventCaches(event2.id, event2.event_date, [...allTeacherIds2, teacher_id1]);

        return savedExchange;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Failed to swap teachers:`, error);
        throw error;
      } finally {
        await queryRunner.release();
      }
    }, this.maxAttempts, this.retryDelay, this.logger, 'swapTeachers');
  }

  // ... 기타 메소드 (validateTeacherExchange, checkTeacherScheduleConflict)

  private async invalidateEventCaches(eventId: number, eventDate: Date, teacherIds: number[]): Promise<void> {
    const uniqueTeacherIds = [...new Set(teacherIds)]; // 중복 제거
    const detailCacheKey = `eventDetail:${eventId}`;
    await this.cacheManager.del(detailCacheKey);
    this.logger.debug(`Invalidated cache: ${detailCacheKey}`);

    const monthStart = startOfMonth(eventDate);
    const monthEnd = endOfMonth(eventDate);
    const listCacheKey = `eventsForList:${format(monthStart, 'yyyy-MM-dd')}:${format(monthEnd, 'yyyy-MM-dd')}`;
    await this.cacheManager.del(listCacheKey);
    this.logger.debug(`Invalidated cache: ${listCacheKey}`);

    if (uniqueTeacherIds.length > 0) {
        for (const teacherId of uniqueTeacherIds) {
            const myEventsCacheKey = `myEventsForList:${teacherId}:${format(monthStart, 'yyyy-MM-dd')}:${format(monthEnd, 'yyyy-MM-dd')}`;
            await this.cacheManager.del(myEventsCacheKey);
            this.logger.debug(`Invalidated cache: ${myEventsCacheKey}`);
        }
    }
  }
}