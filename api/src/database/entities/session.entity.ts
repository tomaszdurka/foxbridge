import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, OptionalProps } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Workspace } from './workspace.entity';
import { Run } from './run.entity';

@Entity()
export class Session {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @ApiProperty({ description: 'Session unique identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryKey()
  sessionId!: string;

  @ApiProperty({ description: 'Session creation timestamp' })
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @ApiProperty({ description: 'Session last update timestamp' })
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @ApiProperty({ description: 'Workspace this session belongs to', type: () => Workspace })
  @ManyToOne(() => Workspace)
  workspace!: Workspace;

  @ApiProperty({ description: 'All runs in this session', type: () => [Run], required: false })
  @OneToMany(() => Run, run => run.session)
  runs = new Collection<Run>(this);
}
