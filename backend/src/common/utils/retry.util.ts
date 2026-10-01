import { Logger } from '@nestjs/common';

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  delay: number,
  logger: Logger,
  operationName: string
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if( error instanceof Error ){
        lastError = error;
        logger.warn(
          `Attempt ${attempt}/${maxAttempts} failed for operation ${operationName}: ${error.message}`
        );
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }    
    }
  }
  throw lastError;
}