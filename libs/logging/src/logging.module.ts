import { DynamicModule, Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { createWinstonLoggerOptions, WinstonLoggerOptions } from './winston.config.js';
import { AppLoggerService } from './logger.service.js';

@Global()
@Module({})
export class LoggingModule {
  static forRoot(options: WinstonLoggerOptions = {}): DynamicModule {
    return {
      module: LoggingModule,
      imports: [WinstonModule.forRoot(createWinstonLoggerOptions(options))],
      providers: [AppLoggerService],
      exports: [WinstonModule, AppLoggerService],
    };
  }
}
