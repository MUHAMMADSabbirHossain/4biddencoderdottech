import { utilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const tsFormat = (): string => {
  const now = new Date();
  // convert UST to IST
  const isOffset = 5.5 * 60 * 60 * 1000;
  const isTime = new Date(now.getTime() + isOffset);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = String(isTime.getDate()).padStart(2, '0');
  const month = months[isTime.getMonth()];
  const year = String(isTime.getFullYear()).slice(-2);
  const hours = String(isTime.getHours()).padStart(2, '0');
  const minutes = String(isTime.getMinutes()).padStart(2, '0');
  const seconds = String(isTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const productionFormat = winston.format.printf(
  ({
    level,
    message,
    timestamp,
    context,
    stack,
    error,
    trace,
    ...metadata
  }) => {
    const logObject: any = {
      '@timestamp': timestamp,
      level,
      message,
      context: context || 'Application',
    };

    if (error) logObject.error = error;
    if (stack) logObject.stack = stack;
    if (trace) logObject.trace = trace;
    if (Object.keys(metadata).length > 0) logObject.metadata = metadata;

    return JSON.stringify(logObject);
  },
);

const consoleTransport = new winston.transports.Console({
  level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    utilities.format.nestLike('Poster Parlor', {
      prettyPrint: true,
      colors: true,
    }),
  ),
});

// Info transport - logs info, warn, and debug (but NOT error)
const fileInfoTransport = new winston.transports.DailyRotateFile({
  dirname: 'logs',
  filename: 'poster-parlor-info-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp({ format: tsFormat }),
    // Filter out error level logs from info file
    winston.format((info) => {
      return info.level === 'error' ? false : info;
    })(),
    productionFormat,
  ),
});

// Error transport - logs ONLY errors
const fileErrorTransport = new winston.transports.DailyRotateFile({
  dirname: 'logs',
  filename: 'poster-parlor-error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: tsFormat }),
    productionFormat,
  ),
});

export const loggerConfig = {
  format: winston.format.combine(
    winston.format.timestamp({ format: tsFormat }),
    winston.format.errors({ stack: true }),
  ),
  transports: [consoleTransport, fileInfoTransport, fileErrorTransport],
  exceptionHandlers: [fileErrorTransport],
  rejectionHandlers: [fileErrorTransport],
};
