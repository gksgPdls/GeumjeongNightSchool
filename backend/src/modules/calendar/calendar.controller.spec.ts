import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarExchangeService } from './calendar-exchange.service';
import { CalendarCancellationService } from './calendar-cancellation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto, EventQueryPeriod } from './dto/event-query.dto';
import { ExchangeClassDto } from './dto/exchange-class.dto';
import { CancelClassDto } from './dto/cancellation-class.dto';
import { MyEventQueryDto } from './dto/my-event-query.dto';
import { BadRequestException } from '@nestjs/common';
import { EventType } from 'night_school_app_dev_libs/interface/calendar.interface';
import { ClassType } from 'night_school_app_dev_libs/interface/class.interface';

describe('CalendarController', () => {
  let controller: CalendarController;
  let calendarService: CalendarService;
  let calendarExchangeService: CalendarExchangeService;
  let calendarCancellationService: CalendarCancellationService;

  const mockCalendarService = {
    createEvent: jest.fn(),
    getMyEventsByPeriod: jest.fn(),
    getEventsByPeriod: jest.fn(),
    getEventDetail: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  const mockCalendarExchangeService = {
    swapTeachers: jest.fn(),
  };

  const mockCalendarCancellationService = {
    cancelClass: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: CalendarExchangeService,
          useValue: mockCalendarExchangeService,
        },
        {
          provide: CalendarCancellationService,
          useValue: mockCalendarCancellationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<CalendarController>(CalendarController);
    calendarService = module.get<CalendarService>(CalendarService);
    calendarExchangeService = module.get<CalendarExchangeService>(CalendarExchangeService);
    calendarCancellationService = module.get<CalendarCancellationService>(CalendarCancellationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create a new class event', async () => {
      const createEventDto: CreateEventDto = {
        event_type: EventType.CLASS,
        event_date: '2024-03-15',
        description: 'Math Class',
        class_type: ClassType.DAISY,
        teacher_ids: [1],
        student_ids: [1, 2],
      };

      const expectedResult = {
        id: 1,
        event_type: EventType.CLASS,
        event_date: '2024-03-15',
        description: 'Math Class',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockRequest = {
        user: { username: 'testuser', teacher_id: 1 },
      };

      mockCalendarService.createEvent.mockResolvedValue(expectedResult);

      const result = await controller.createEvent(createEventDto, mockRequest);

      expect(calendarService.createEvent).toHaveBeenCalledWith(createEventDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create a meeting event', async () => {
      const createEventDto: CreateEventDto = {
        event_type: EventType.MEETING,
        event_date: '2024-03-15',
        description: 'Staff Meeting',
        class_type: ClassType.UNKNOWN, // Required field even for non-class events
        teacher_ids: [1],
        student_ids: [],
      };

      const expectedResult = {
        id: 2,
        event_type: EventType.MEETING,
        event_date: '2024-03-15',
        description: 'Staff Meeting',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockRequest = {
        user: { username: 'admin', teacher_id: 1 },
      };

      mockCalendarService.createEvent.mockResolvedValue(expectedResult);

      const result = await controller.createEvent(createEventDto, mockRequest);

      expect(calendarService.createEvent).toHaveBeenCalledWith(createEventDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create a holiday event', async () => {
      const createEventDto: CreateEventDto = {
        event_type: EventType.HOLIDAY,
        event_date: '2024-03-15',
        description: 'National Holiday',
        class_type: ClassType.UNKNOWN,
        teacher_ids: [],
        student_ids: [],
      };

      const expectedResult = {
        id: 3,
        event_type: EventType.HOLIDAY,
        event_date: '2024-03-15',
        description: 'National Holiday',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockRequest = {
        user: { username: 'admin', teacher_id: 1 },
      };

      mockCalendarService.createEvent.mockResolvedValue(expectedResult);

      const result = await controller.createEvent(createEventDto, mockRequest);

      expect(calendarService.createEvent).toHaveBeenCalledWith(createEventDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyEventsByPeriod', () => {
    it('should return events for a teacher', async () => {
      const mockRequest = {
        user: { username: 'teacher1', teacher_id: 1 },
      };

      const queryDto: MyEventQueryDto = {
        period: EventQueryPeriod.ONE_MONTH,
      };

      const expectedResult = [
        {
          id: 1,
          event_type: EventType.CLASS,
          event_date: '2024-03-15',
          description: 'Math Class',
        },
      ];

      mockCalendarService.getMyEventsByPeriod.mockResolvedValue(expectedResult);

      const result = await controller.getMyEventsByPeriod(mockRequest, queryDto);

      expect(calendarService.getMyEventsByPeriod).toHaveBeenCalledWith(1, queryDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for non-teacher user', async () => {
      const mockRequest = {
        user: { username: 'student1', teacher_id: null },
      };

      const queryDto: MyEventQueryDto = {
        period: EventQueryPeriod.ONE_MONTH,
      };

      await expect(controller.getMyEventsByPeriod(mockRequest, queryDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for user without teacher_id', async () => {
      const mockRequest = {
        user: { username: 'admin1' },
      };

      const queryDto: MyEventQueryDto = {
        period: EventQueryPeriod.ONE_MONTH,
      };

      await expect(controller.getMyEventsByPeriod(mockRequest, queryDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events for a specific period', async () => {
      const period = EventQueryPeriod.ONE_WEEK;
      const mockRequest = {
        user: { username: 'testuser' },
      };

      const expectedResult = [
        {
          id: 1,
          event_type: EventType.CLASS,
          event_date: '2024-03-15',
          description: 'Weekly Event',
        },
      ];

      mockCalendarService.getEventsByPeriod.mockResolvedValue(expectedResult);

      const result = await controller.getEventsByDateRange(period, mockRequest);

      expect(calendarService.getEventsByPeriod).toHaveBeenCalledWith(
        expect.objectContaining({ period }),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle three months period', async () => {
      const period = EventQueryPeriod.THREE_MONTHS;
      const mockRequest = {
        user: { username: 'testuser' },
      };

      const expectedResult = [
        {
          id: 1,
          event_type: EventType.ACTIVITY,
          event_date: '2024-03-15',
          description: 'Quarterly Activity',
        },
      ];

      mockCalendarService.getEventsByPeriod.mockResolvedValue(expectedResult);

      const result = await controller.getEventsByDateRange(period, mockRequest);

      expect(calendarService.getEventsByPeriod).toHaveBeenCalledWith(
        expect.objectContaining({ period }),
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('testRange', () => {
    it('should return the period for testing', () => {
      const period = EventQueryPeriod.ONE_DAY;

      const result = controller.testRange(period);

      expect(result).toEqual({ period });
    });
  });

  describe('getSingleEventDetail', () => {
    it('should return event detail', async () => {
      const eventId = 1;
      const mockRequest = {
        user: { username: 'testuser' },
      };

      const expectedResult = {
        id: 1,
        event_type: EventType.CLASS,
        event_date: '2024-03-15',
        description: 'Math Class Detail',
        attendees: [],
        teachers: [],
      };

      mockCalendarService.getEventDetail.mockResolvedValue(expectedResult);

      const result = await controller.getSingleEventDetail(eventId, mockRequest);

      expect(calendarService.getEventDetail).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateEvent', () => {
    it('should update an event description', async () => {
      const eventId = 1;
      const updateEventDto: UpdateEventDto = {
        description: 'Updated Math Class Description',
        class_type: ClassType.ROSE,
      };

      const mockRequest = {
        user: { username: 'testuser' },
      };

      const expectedResult = {
        id: 1,
        description: 'Updated Math Class Description',
        class_type: ClassType.ROSE,
        updated_at: new Date(),
      };

      mockCalendarService.updateEvent.mockResolvedValue(expectedResult);

      const result = await controller.updateEvent(eventId, updateEventDto, mockRequest);

      expect(calendarService.updateEvent).toHaveBeenCalledWith(eventId, updateEventDto);
      expect(result).toEqual(expectedResult);
    });

    it('should update teacher and student assignments', async () => {
      const eventId = 2;
      const updateEventDto: UpdateEventDto = {
        teacher_ids: [2, 3],
        student_ids: [1, 2, 3, 4],
      };

      const mockRequest = {
        user: { username: 'admin' },
      };

      const expectedResult = {
        id: 2,
        teacher_ids: [2, 3],
        student_ids: [1, 2, 3, 4],
        updated_at: new Date(),
      };

      mockCalendarService.updateEvent.mockResolvedValue(expectedResult);

      const result = await controller.updateEvent(eventId, updateEventDto, mockRequest);

      expect(calendarService.updateEvent).toHaveBeenCalledWith(eventId, updateEventDto);
      expect(result).toEqual(expectedResult);
    });

    it('should update class type for weekend classes', async () => {
      const eventId = 3;
      const updateEventDto: UpdateEventDto = {
        class_type: ClassType.SMARTPHONE,
        description: 'Updated smartphone class for seniors',
      };

      const mockRequest = {
        user: { username: 'teacher2' },
      };

      const expectedResult = {
        id: 3,
        class_type: ClassType.SMARTPHONE,
        description: 'Updated smartphone class for seniors',
        updated_at: new Date(),
      };

      mockCalendarService.updateEvent.mockResolvedValue(expectedResult);

      const result = await controller.updateEvent(eventId, updateEventDto, mockRequest);

      expect(calendarService.updateEvent).toHaveBeenCalledWith(eventId, updateEventDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const eventId = 1;
      const mockRequest = {
        user: { username: 'testuser' },
      };

      mockCalendarService.deleteEvent.mockResolvedValue(undefined);

      const result = await controller.deleteEvent(eventId, mockRequest);

      expect(calendarService.deleteEvent).toHaveBeenCalledWith(eventId);
      expect(result).toEqual({ message: 'Event deleted successfully' });
    });
  });

  describe('exchange', () => {
    it('should exchange teachers between events', async () => {
      const exchangeDto: ExchangeClassDto = {
        event_id1: 1,
        teacher_id1: 1,
        event_id2: 2,
        teacher_id2: 2,
      };

      const mockRequest = {
        user: { username: 'teacher1' },
      };

      const expectedResult = {
        success: true,
        message: 'Teachers exchanged successfully',
      };

      mockCalendarExchangeService.swapTeachers.mockResolvedValue(expectedResult);

      const result = await controller.exchange(exchangeDto, mockRequest);

      expect(calendarExchangeService.swapTeachers).toHaveBeenCalledWith(exchangeDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('cancel', () => {
    it('should cancel a class', async () => {
      const cancelDto: CancelClassDto = {
        event_id: 1,
        teacher_id: 1,
        cancellation_reason: 'Emergency situation',
      };

      const mockRequest = {
        user: { username: 'teacher1' },
      };

      const expectedResult = {
        success: true,
        message: 'Class cancelled successfully',
      };

      mockCalendarCancellationService.cancelClass.mockResolvedValue(expectedResult);

      const result = await controller.cancel(cancelDto, mockRequest);

      expect(calendarCancellationService.cancelClass).toHaveBeenCalledWith(cancelDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
