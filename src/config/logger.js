import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
});

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack ? `\n${info.stack}` : ''}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const transports = [  
  new winston.transports.File({ filename: 'logs/error.log', level: 'error', format: fileFormat }),
  new winston.transports.File({ filename: 'logs/combined.log', format: fileFormat }),
];

// Adiciona o transporte de console apenas se não estiver em ambiente de teste.
if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.Console({ format: consoleFormat }));
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Cria um stream com uma função `write` que pode ser usada pelo Morgan
logger.stream = {
  // Usa o nível 'http' para que o log seja capturado pelos transports.
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;