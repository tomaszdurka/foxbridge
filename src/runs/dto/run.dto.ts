import { IsString, IsNotEmpty, IsObject, IsOptional, Matches } from 'class-validator';

export class RunDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsObject()
  @IsOptional()
  schema?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @Matches(/^[a-f0-9-]+$/, { message: 'workspaceId must be a valid UUID format (alphanumeric and hyphens only)' })
  workspaceId?: string;
}
