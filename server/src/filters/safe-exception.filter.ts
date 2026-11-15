import {
  ArgumentsHost,
  Catch,
  HttpException,
  type ExceptionFilter,
} from '@nestjs/common'
import { MongoNetworkError, MongoOperationTimeoutError, MongoServerSelectionError, MongoTopologyClosedError } from 'mongodb'

interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): unknown
}

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<ApiResponse>()
    let status = exception instanceof HttpException ? exception.getStatus() : 500
    if (exception instanceof MongoNetworkError
      || exception instanceof MongoOperationTimeoutError
      || exception instanceof MongoServerSelectionError
      || exception instanceof MongoTopologyClosedError) {
      status = 503
    }
    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined
    const receiptConflict = status === 409 && typeof exceptionBody === 'object'
      && 'code' in exceptionBody && exceptionBody.code === 'warehouse_receipt_conflict'
    const message = new Map([
      [401, 'Sign in required or invalid credentials'],
      [403, 'Access denied'],
      [404, 'Not found'],
      [409, receiptConflict ? 'Receipt ID already used with different details' : 'Account already exists'],
      [429, 'Too many attempts'],
      [503, 'Database unavailable'],
    ]).get(status) ?? (status >= 500 ? 'Internal server error' : 'Bad request')
    response.status(status).json({ error: { message } })
  }
}
