import { IsEnum, IsOptional, IsString, IsDate } from 'class-validator';
import {Type} from 'class-transformer'
/**
 *  Event Query Period  Enum
 */
export enum EventQueryPeriod {
  THREE_MONTHS = 'THREE_MONTHS',
  ONE_MONTH = 'ONE_MONTH',
  ONE_WEEK = 'ONE_WEEK',
  ONE_DAY = 'ONE_DAY'
}

/**
 * Period based Event Qeury DTO
 * - period, cacheToken:
 */
export class EventQueryDto {
  @IsEnum(EventQueryPeriod)
  period!: EventQueryPeriod;

  @IsOptional()
  @IsString()
  cache_token?: string;
}

export class EventDetailQueryDto {
    @IsDate()
    @Type(()=>Date)
    eventDate! : Date;

    @IsOptional()
    @IsString()
    cache_token?: string;
}