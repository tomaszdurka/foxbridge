import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkspaceDto {
  @ApiProperty({
    description: 'Workspace name',
    required: false,
    nullable: true,
    example: 'My Project Workspace'
  })
  @IsString()
  @IsOptional()
  name?: string | null;
}
