import {
  Controller,
  Logger,
  Get,
  Post,
  Query,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ParseEnumPipe,
  Request,
  UseGuards,
  Req,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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

// We should add Logger 
// Well known 'Pino' or 'Winston' will gonna work

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly calendarExchangeService: CalendarExchangeService,
    private readonly calendarCancellationService: CalendarCancellationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('events')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '새 이벤트 생성' })
  @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req) {
    this.logger.log(`User ${req.user.username} creating new event: ${JSON.stringify(createEventDto)}`);
    return this.calendarService.createEvent(createEventDto);
  }

  @Get('events/my')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '내 이벤트 조회 (교사 전용)' })
  @ApiResponse({ status: 200, description: '이벤트 목록 조회 성공' })
  @ApiResponse({ status: 400, description: '교사 전용 엔드포인트' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async getMyEventsByPeriod(
    @Request() req,
    @Query() queryDto: MyEventQueryDto,
  ) {
    const teacherId = req.user.teacher_id; 
    if (!teacherId) {
      throw new BadRequestException('This endpoint is for teachers only.');
    }
    
    this.logger.log(`Fetching events for teacher ID: ${teacherId} with period: ${queryDto.period}`);

    return this.calendarService.getMyEventsByPeriod(teacherId, queryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('events-range')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '기간별 이벤트 조회' })
  @ApiQuery({ 
    name: 'period', 
    enum: EventQueryPeriod,
    description: '조회할 기간' 
  })
  @ApiResponse({ status: 200, description: '이벤트 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async getEventsByDateRange(@Query('period', new ParseEnumPipe(EventQueryPeriod)) period: EventQueryPeriod, @Request() req) {
    const queryDto = new EventQueryDto();
    queryDto.period = period;
    this.logger.log(`User ${req.user.username} etching Events with Period: ${queryDto.period}`);
    return this.calendarService.getEventsByPeriod(queryDto);
  }

  @Get('test-range')
  @ApiOperation({ summary: '기간 테스트 엔드포인트' })
  @ApiQuery({ 
    name: 'period', 
    enum: EventQueryPeriod,
    description: '테스트할 기간' 
  })
  @ApiResponse({ status: 200, description: '테스트 성공' })
  testRange(@Query('period', new ParseEnumPipe(EventQueryPeriod)) period: EventQueryPeriod) {
    return { period };
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('events/detail')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 상세 정보 조회' })
  @ApiQuery({ name: 'id', type: 'number', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 상세 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async getSingleEventDetail(@Query('id', ParseIntPipe) id: number, @Request() req) {
    this.logger.log(`User ${req.user.username} fetching Event in detail for event id: ${id}`);
    return this.calendarService.getEventDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 수정' })
  @ApiParam({ name: 'id', type: 'number', description: '수정할 이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req
  ) {
    this.logger.log(`User ${req.user.username} updating event ${id}: ${JSON.stringify(updateEventDto)}`);
    return this.calendarService.updateEvent(id, updateEventDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 삭제' })
  @ApiParam({ name: 'id', type: 'number', description: '삭제할 이벤트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Event deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async deleteEvent(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.logger.log(` User ${req.user.username} deleting event ${id}`);
    await this.calendarService.deleteEvent(id);
    return { message: 'Event deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('exchange')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '교사 교환' })
  @ApiResponse({ status: 200, description: '교사 교환 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async exchange(@Body() exchangeDto: ExchangeClassDto, @Request() req) {
    this.logger.log(
      `User ${req.user.username} exchanging teachers with data: ${JSON.stringify(exchangeDto)}`,
    );
    return this.calendarExchangeService.swapTeachers(exchangeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '수업 취소' })
  @ApiResponse({ status: 200, description: '수업 취소 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async cancel(@Body() cancelDto: CancelClassDto, @Request() req) {
    this.logger.log(
      `User ${req.user.username} cancelling class with data: ${JSON.stringify(cancelDto)}`,
    );
    return this.calendarCancellationService.cancelClass(cancelDto);
  }

  //출석 기능 추가해야 함.
  //학생출석은 그냥 누르면 바로
  //교사춠석은 gps정보가 같이 날라와서 야학이랑 거리기반 체크
  //자동으로 하루가 지날때마다 이벤트 업데이트
}