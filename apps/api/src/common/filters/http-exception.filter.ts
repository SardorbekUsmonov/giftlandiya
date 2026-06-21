import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'object' && raw !== null) {
        const res = raw as Record<string, unknown>;
        const msg = res.message;
        details = Array.isArray(msg) ? msg : undefined;
        message = Array.isArray(msg)
          ? 'Validation failed'
          : (msg as string) ?? exception.message;
        code =
          typeof res.error === 'string'
            ? res.error.toUpperCase().replace(/\s+/g, '_')
            : this.statusToCode(status);
      } else {
        message = raw as string;
        code = this.statusToCode(status);
      }
    }

    const body: Record<string, unknown> = {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };

    reply.status(status).send(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
