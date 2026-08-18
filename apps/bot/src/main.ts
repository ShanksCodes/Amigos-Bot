import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WinstonModule, createWinstonLoggerOptions } from '@app/logging';
import { BotModule } from './bot.module';

async function bootstrap() {
  const winstonLogger = WinstonModule.createLogger(
    createWinstonLoggerOptions({ appName: 'AmigosBot' }),
  );

  const app = await NestFactory.createApplicationContext(BotModule, {
    logger: winstonLogger,
  });

  app.enableShutdownHooks();

  const logger = new Logger('Bootstrap');
  logger.log('AmigosBot application initialized successfully.');
}

bootstrap().catch((err: Error) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    `Fatal error during bootstrap: ${err?.message ?? err}`,
    err?.stack,
  );
  process.exit(1);
});
