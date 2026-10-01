import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventQueryPeriod } from './event-query.dto'; 

export class MyEventQueryDto {
  @IsEnum(EventQueryPeriod)
  @IsNotEmpty()
  period: EventQueryPeriod;
}