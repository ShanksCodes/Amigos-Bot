import * as winston from 'winston';
import { utilities as nestWinstonUtilities } from 'nest-winston';

export interface WinstonLoggerOptions {
  appName?: string;
  isProduction?: boolean;
  logLevel?: string;
}

const SENSITIVE_KEYS = [
  'token',
  'discord_token',
  'password',
  'secret',
  'authorization',
  'apikey',
  'api_key',
  'database_url',
];

function sanitizeObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const sanitizeFormat = winston.format((info) => {
  return sanitizeObject(info) as winston.Logform.TransformableInfo;
});

export function createWinstonLoggerOptions(
  options: WinstonLoggerOptions = {},
): winston.LoggerOptions {
  const isProduction =
    options.isProduction ?? process.env.NODE_ENV === 'production';
  const appName = options.appName ?? 'AmigosBot';
  const defaultLogLevel =
    options.logLevel ?? process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

  const devFormat = winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.ms(),
    nestWinstonUtilities.format.nestLike(appName, {
      colors: true,
      prettyPrint: true,
      processId: true,
      appName: true,
    }),
  );

  const prodFormat = winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  return {
    level: defaultLogLevel,
    transports: [
      new winston.transports.Console({
        format: isProduction ? prodFormat : devFormat,
      }),
    ],
  };
}
