import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService extends WinstonLogger implements NestLoggerService {}
