import { Options } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { Workspace, Session, Run, RunEvent, Prompt } from './database/entities';
import * as path from 'path';

const config: Options = {
  driver: BetterSqliteDriver,
  dbName: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'uno-computer.db'),
  entities: [Workspace, Session, Run, RunEvent, Prompt],
  allowGlobalContext: true,
};

export default config;
