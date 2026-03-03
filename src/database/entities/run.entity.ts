import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum, OptionalProps } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Workspace } from './workspace.entity';
import { Session } from './session.entity';
import { RunEvent } from './run-event.entity';

export enum RunStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  STOPPED = 'stopped',
}

@Entity()
export class Run {
  [OptionalProps]?: 'startedAt' | 'lastHeartbeat';

  @ApiProperty({ description: 'Run unique identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryKey()
  runId!: string;

  @ApiProperty({ description: 'The prompt that was executed' })
  @Property({ type: 'text' })
  prompt!: string;

  @ApiProperty({ description: 'Output JSON schema if provided', required: false })
  @Property({ type: 'json', nullable: true })
  outputSchema?: object;

  @ApiProperty({ description: 'Run status', enum: RunStatus })
  @Enum(() => RunStatus)
  status!: RunStatus;

  @ApiProperty({ description: 'Run result data', required: false })
  @Property({ type: 'json', nullable: true })
  result?: object;

  @ApiProperty({ description: 'Process exit code', required: false })
  @Property({ nullable: true })
  exitCode?: number;

  @ApiProperty({ description: 'Run start timestamp' })
  @Property({ onCreate: () => new Date() })
  startedAt!: Date;

  @ApiProperty({ description: 'Run completion timestamp', required: false })
  @Property({ nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Last heartbeat timestamp', required: false })
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true })
  lastHeartbeat?: Date;

  @ApiProperty({ description: 'Session this run belongs to', type: () => Session })
  @ManyToOne(() => Session)
  session!: Session;

  @ApiProperty({ description: 'Workspace this run belongs to', type: () => Workspace })
  @ManyToOne(() => Workspace)
  workspace!: Workspace;

  @ApiProperty({ description: 'All events from the run', type: () => [RunEvent], required: false })
  @OneToMany(() => RunEvent, event => event.run)
  events = new Collection<RunEvent>(this);
}
