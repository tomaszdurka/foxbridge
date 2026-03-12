import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Prompt } from '../database/entities';
import { CreatePromptDto, UpdatePromptDto } from './dto/prompt.dto';
import { PersistenceService } from '../database/persistence.service';

@ApiTags('prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly persistence: PersistenceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prompt' })
  @ApiResponse({ status: 201, description: 'Prompt created', type: Prompt })
  async createPrompt(@Body() dto: CreatePromptDto): Promise<Prompt> {
    return await this.persistence.createPrompt({
      name: dto.name,
      description: dto.description,
      prompt: dto.prompt,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all prompts' })
  @ApiResponse({ status: 200, description: 'List of prompts', type: [Prompt] })
  async listPrompts(): Promise<Prompt[]> {
    return await this.persistence.findAllPrompts();
  }

  @Get(':promptId')
  @ApiOperation({ summary: 'Get prompt by ID' })
  @ApiParam({ name: 'promptId' })
  @ApiResponse({ status: 200, description: 'Prompt details', type: Prompt })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async getPrompt(@Param('promptId') promptId: string): Promise<Prompt> {
    const prompt = await this.persistence.getPrompt({ promptId });
    if (!prompt) {
      throw new NotFoundException(`Prompt ${promptId} not found`);
    }
    return prompt;
  }

  @Patch(':promptId')
  @ApiOperation({ summary: 'Update a prompt' })
  @ApiParam({ name: 'promptId' })
  @ApiResponse({ status: 200, description: 'Prompt updated', type: Prompt })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async updatePrompt(
    @Param('promptId') promptId: string,
    @Body() dto: UpdatePromptDto
  ): Promise<Prompt> {
    const prompt = await this.persistence.updatePrompt({
      promptId,
      ...dto,
    });
    if (!prompt) {
      throw new NotFoundException(`Prompt ${promptId} not found`);
    }
    return prompt;
  }

  @Delete(':promptId')
  @ApiOperation({ summary: 'Delete a prompt' })
  @ApiParam({ name: 'promptId' })
  @ApiResponse({ status: 200, description: 'Prompt deleted' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async deletePrompt(@Param('promptId') promptId: string): Promise<{ success: boolean }> {
    const success = await this.persistence.deletePrompt({ promptId });
    if (!success) {
      throw new NotFoundException(`Prompt ${promptId} not found`);
    }
    return { success: true };
  }
}
