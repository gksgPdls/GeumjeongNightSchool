import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: '서버 상태 확인' })
  @ApiResponse({ 
    status: 200, 
    description: '서버가 정상적으로 동작 중',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-03-15T10:30:00.000Z' },
        uptime: { type: 'number', example: 12345 }
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  @Get()
  @ApiOperation({ summary: '루트 엔드포인트' })
  @ApiResponse({ 
    status: 200, 
    description: 'API 루트 메시지',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Night School Management API' },
        version: { type: 'string', example: '1.0' },
        docs: { type: 'string', example: '/api' }
      }
    }
  })
  getRoot() {
    return {
      message: 'Night School Management API',
      version: '1.0',
      docs: '/api'
    };
  }
}
