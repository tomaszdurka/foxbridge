import { IsString, IsNotEmpty, IsObject, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunDto {
  @ApiProperty({
    description: 'The prompt to execute with Claude',
    example: 'Write a function that calculates fibonacci numbers'
  })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiProperty({
    description: 'Optional JSON schema for structured output',
    required: false,
    example: { type: 'object', properties: { result: { type: 'number' } } }
  })
  @IsObject()
  @IsOptional()
  schema?: Record<string, unknown>;

  @ApiProperty({
    description: 'Optional workspace ID (creates new session in workspace if provided without sessionId)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-f0-9-]+$/, { message: 'workspaceId must be a valid UUID format' })
  workspaceId?: string;

  @ApiProperty({
    description: 'Optional session ID (continues existing session if provided)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-f0-9-]+$/, { message: 'sessionId must be a valid UUID format' })
  sessionId?: string;
}
