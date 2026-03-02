import { Entity, PrimaryKey, Property, OneToMany, Collection, OptionalProps } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Run } from './run.entity';

@Entity()
export class Workspace {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @ApiProperty({ description: 'Workspace unique identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryKey()
  workspaceId!: string;

  @ApiProperty({ description: 'Workspace directory path' })
  @Property()
  workingDir!: string;

  @ApiProperty({ description: 'Workspace creation timestamp' })
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @ApiProperty({ description: 'Workspace last update timestamp' })
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @ApiProperty({ description: 'Runs in this workspace', type: () => [Run], required: false })
  @OneToMany(() => Run, run => run.workspace)
  runs = new Collection<Run>(this);
}
