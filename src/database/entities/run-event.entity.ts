import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Run } from './run.entity';

@Entity()
export class RunEvent {
  [OptionalProps]?: 'createdAt';

  @ApiProperty({ description: 'Event unique identifier' })
  @PrimaryKey()
  id!: string;

  @ApiProperty({ description: 'Event type', example: 'text' })
  @Property()
  type!: string;

  @ApiProperty({ description: 'Event payload data' })
  @Property({ type: 'json' })
  payload!: object;

  @ApiProperty({ description: 'Sequence number within the run' })
  @Property()
  sequence!: number;

  @ApiProperty({ description: 'Event source', enum: ['stdout', 'stderr', 'controller'] })
  @Property()
  source!: string;

  @ApiProperty({ description: 'Event creation timestamp' })
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @ManyToOne(() => Run)
  run!: Run;
}
