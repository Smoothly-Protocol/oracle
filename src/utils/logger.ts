import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf, colorize } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  timestamp = `[${timestamp.split(' ').join('|')}]`
  return `${timestamp} ${level}: ${message}`;
});

export const logger = createLogger({
  format: combine(
    format(info => {
      info.level = info.level.toUpperCase()
      return info;
    })(),
    colorize(),
    timestamp({format: "MM-DD hh:mm:ss.SSS"}),
    myFormat
  ),
  transports: [new transports.Console()]
});
