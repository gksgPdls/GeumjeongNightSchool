import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
  import { Observable, throwError } from 'rxjs';
  import { tap, catchError } from 'rxjs/operators';
  
  @Injectable()
  export class MetricsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(MetricsInterceptor.name);
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const startTime = Date.now();
  
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      const method = request.method;
      // route.path가 없으면 URL을 fallback 처리
      const route = request.route?.path || request.originalUrl || request.url;
  
      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const contentLength = response.get('Content-Length') || 'unknown';
          this.logger.log(
            `HTTP ${method} ${route} succeeded in ${duration}ms, status: ${statusCode}, content length: ${contentLength}`,
          );
          // ADD : External Metric System Cacl Time, Status Code Record Logic
        }),
        catchError((err) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.error(
            `HTTP ${method} ${route} failed in ${duration}ms, status: ${statusCode}`,
            err.stack,
          );
          // ADD : External Metric System Error Count Logic
          return throwError(err);
        }),
      );
    }
  }