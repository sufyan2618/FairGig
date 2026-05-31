const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
const SERVICE_NAME = 'api-gateway';

const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const shouldLog = (level) =>
  LEVEL_PRIORITY[level] >= (LEVEL_PRIORITY[LOG_LEVEL] ?? LEVEL_PRIORITY.info);

const serializeError = (error) => {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
    };
  }

  return { error_message: String(error) };
};

const writeLog = (level, message, fields = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    time: new Date().toISOString(),
    level: level.toUpperCase(),
    service: SERVICE_NAME,
    message,
    ...fields,
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

export const logger = {
  debug: (message, fields) => writeLog('debug', message, fields),
  info: (message, fields) => writeLog('info', message, fields),
  warn: (message, fields) => writeLog('warn', message, fields),
  error: (message, error, fields) =>
    writeLog('error', message, { ...fields, ...serializeError(error) }),
};

export const logRequest = (req, res, startMs, extra = {}) => {
  if (req.url === '/health' || req.url === '/metrics') {
    return;
  }

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startMs);
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    writeLog(level, 'gateway request completed', {
      event: 'http_request',
      method: req.method,
      path: req.url,
      status_code: res.statusCode,
      duration_ms: durationMs,
      client_ip: req.socket?.remoteAddress,
      ...extra,
    });
  });
};
