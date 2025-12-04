import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';

@Controller('api/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async findAll(): Promise<Question[]> {
    return this.questionsService.findAll();
  }

  @Get('approved')
  async findApproved(): Promise<Question[]> {
    return this.questionsService.findApproved();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Question> {
    return this.questionsService.findOne(id);
  }

  @Post()
  async create(@Body() questionData: Partial<Question>): Promise<Question> {
    return this.questionsService.create(questionData);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<Question>,
  ): Promise<Question> {
    return this.questionsService.update(id, updateData);
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<Question> {
    return this.questionsService.approve(id);
  }
}

