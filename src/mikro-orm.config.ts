import { Options } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Workspace, Session, Run, RunEvent } from './database/entities';
import * as path from 'path';

const config: Options = {
  driver: SqliteDriver,
  dbName: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'foxbridge.db'),
  entities: [Workspace, Session, Run, RunEvent],
  allowGlobalContext: true,
};

export default config;
