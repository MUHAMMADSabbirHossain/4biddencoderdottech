import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './logger.config';
import { AppLogger } from './logger.service';

@Global() // Make it global so you don't need to import everywhere
@Module({
  imports: [WinstonModule.forRoot(loggerConfig)],
  controllers: [],
  providers: [AppLogger],
  exports: [AppLogger, WinstonModule],
})
export class LoggerModule {}
