import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  @Post('message')
  createMessage(@Req() req, @Body() dto: CreateMessageDto) {
    const senderId: string = req.user.id;
    return this.chatService.createMessage(senderId, dto);
  }

  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @Get('my-conversations')
  getMyConversations(@Req() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @Get('conversation/:id/messages')
  getMessages(@Param('id') id: string, @Req() req) {
    return this.chatService.getMessages(id, req.user.id);
  }
}
