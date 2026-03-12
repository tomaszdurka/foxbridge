import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromptDto {
  @ApiProperty({
    description: 'Prompt name',
    example: 'Code Review Prompt'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Prompt description',
    required: false,
    example: 'A prompt for reviewing code quality'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The prompt text',
    example: 'Review this code for best practices and suggest improvements'
  })
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}

export class UpdatePromptDto {
  @ApiProperty({
    description: 'Prompt name',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Prompt description',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The prompt text',
    required: false
  })
  @IsString()
  @IsOptional()
  prompt?: string;
}
