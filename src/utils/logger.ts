import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const logsDir = path.resolve(process.cwd(), 'test-results', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context }) => {
    const ctx = context ? `[${context}] ` : '';
    return `${timestamp} ${level}: ${ctx}${message}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

const rootLogger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(logsDir, 'framework.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error',
      format: fileFormat,
    }),
  ],
});

/**
 * Logger — thin wrapper around winston that adds per-class context labels.
 *
 * Usage:
 *   private readonly logger = new Logger('ContactsPage');
 *   this.logger.info('Creating contact');
 *   this.logger.error('Failed', err);
 */
export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    rootLogger.info(message, { context: this.context });
  }

  warn(message: string): void {
    rootLogger.warn(message, { context: this.context });
  }

  error(message: string, error?: unknown): void {
    const extra = error instanceof Error ? ` — ${error.stack}` : '';
    rootLogger.error(`${message}${extra}`, { context: this.context });
  }

  debug(message: string): void {
    rootLogger.debug(message, { context: this.context });
  }
}
