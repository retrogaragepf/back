import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';

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

  @Get('admin/conversation/:id/messages')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMessagesAsAdmin(@Param('id') id: string, @Req() req) {
    return this.chatService.getMessagesAsAdmin(id, req.user.id);
  }

  @Post('support')
  @UseGuards(JwtAuthGuard)
  async createSupportConversation(
    @Req() req,
    @Body() body: { subject: string; detail: string },
  ) {
    return this.chatService.createSupportConversation(req.user.id, body);
  }

  @Patch(':id/block')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async blockConversation(@Param('id') id: string) {
    return this.chatService.blockConversation(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteConversation(@Param('id') id: string, @Req() req) {
    return this.chatService.deleteConversation(id, req.user.id);
  }

  @Delete('admin/conversation/:id')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteConversationAsAdmin(@Param('id') id: string) {
    return this.chatService.deleteConversationAsAdmin(id);
  }
}
