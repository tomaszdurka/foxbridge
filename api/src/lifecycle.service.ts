import { Injectable, Logger, OnModuleInit, BeforeApplicationShutdown } from '@nestjs/common';
import { PersistenceService } from './database/persistence.service';

@Injectable()
export class LifecycleService implements OnModuleInit, BeforeApplicationShutdown {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(private readonly persistence: PersistenceService) {}

  /**
   * Called when the module is initialized
   * Stop any runs that were left in "running" state from previous session
   */
  async onModuleInit() {
    this.logger.log('Service starting - checking for interrupted runs...');
    const stoppedCount = await this.persistence.stopAllRunningRuns();
    if (stoppedCount > 0) {
      this.logger.warn(`Found and stopped ${stoppedCount} interrupted run(s) from previous session`);
    } else {
      this.logger.log('No interrupted runs found');
    }
  }

  /**
   * Called before application shutdown
   * Stop any currently running runs
   */
  async beforeApplicationShutdown(signal?: string) {
    this.logger.log(`Service shutting down (signal: ${signal || 'none'}) - stopping running runs...`);
    const stoppedCount = await this.persistence.stopAllRunningRuns();
    if (stoppedCount > 0) {
      this.logger.log(`Stopped ${stoppedCount} running run(s) before shutdown`);
    }
  }
}
