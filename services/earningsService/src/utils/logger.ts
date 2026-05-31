import { trace, context } from '@opentelemetry/api';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogFields = Record<string, unknown>;

const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
const SERVICE_NAME = 'earnings-service';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const shouldLog = (level: LogLevel): boolean =>
  LEVEL_PRIORITY[level] >= (LEVEL_PRIORITY[LOG_LEVEL as LogLevel] ?? LEVEL_PRIORITY.info);

const serializeError = (error: unknown): LogFields => {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
    };
  }

  return { error_message: String(error) };
};

const writeLog = (level: LogLevel, message: string, fields: LogFields = {}): void => {
  if (!shouldLog(level)) {
    return;
  }

  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();

  const payload: LogFields = {
    time: new Date().toISOString(),
    level: level.toUpperCase(),
    service: SERVICE_NAME,
    message,
    ...fields,
  };

  if (spanContext?.traceId) {
    payload.trace_id = spanContext.traceId;
  }
  if (spanContext?.spanId) {
    payload.span_id = spanContext.spanId;
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

export const logger = {
  debug: (message: string, fields?: LogFields) => writeLog('debug', message, fields),
  info: (message: string, fields?: LogFields) => writeLog('info', message, fields),
  warn: (message: string, fields?: LogFields) => writeLog('warn', message, fields),
  error: (message: string, error?: unknown, fields?: LogFields) =>
    writeLog('error', message, { ...fields, ...serializeError(error) }),
};

export const requestLogger = (
  req: { method: string; originalUrl: string; ip?: string; authUser?: { id: string; role: string } },
  res: { statusCode: number; on: (event: string, listener: () => void) => void },
  startMs: number,
): void => {
  if (req.originalUrl === '/metrics' || req.originalUrl.endsWith('/health')) {
    return;
  }

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startMs);
    const level: LogLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    writeLog(level, 'request completed', {
      event: 'http_request',
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: durationMs,
      client_ip: req.ip,
      user_id: req.authUser?.id,
      user_role: req.authUser?.role,
    });
  });
};
