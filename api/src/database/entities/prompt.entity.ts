import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Prompt {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @ApiProperty({ description: 'Prompt unique identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryKey()
  promptId!: string;

  @ApiProperty({ description: 'Prompt name' })
  @Property()
  name!: string;

  @ApiProperty({ description: 'Prompt description', required: false })
  @Property({ nullable: true })
  description?: string;

  @ApiProperty({ description: 'The prompt text' })
  @Property({ type: 'text' })
  prompt!: string;

  @ApiProperty({ description: 'Created timestamp' })
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;
}
