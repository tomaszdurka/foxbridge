import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class RunClaudeDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsObject()
  @IsOptional()
  schema?: Record<string, unknown>;
}
