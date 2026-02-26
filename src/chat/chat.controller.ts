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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ChatGateway } from './chat.gateway';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // =========================================
  // CREAR CONVERSACIÓN
  // =========================================

  @Post('conversations')
  @ApiOperation({
    summary: 'Crear nueva conversación',
    description: 'Crea una nueva conversación entre usuarios.',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversación creada correctamente',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  // =========================================
  // ENVIAR MENSAJE
  // =========================================

  @Post('message')
  @ApiOperation({
    summary: 'Enviar mensaje',
    description:
      'Crea un nuevo mensaje dentro de una conversación y emite evento websocket "newMessage".',
  })
  @ApiResponse({ status: 201, description: 'Mensaje enviado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  async createMessage(@Req() req, @Body() dto: CreateMessageDto) {
    const senderId: string = req.user.id;
    const message = await this.chatService.createMessage(senderId, dto);

    this.chatGateway.server.to(dto.conversationId).emit('newMessage', {
      id: message.id,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: message.sender,
      conversationId: dto.conversationId,
      senderId: message.sender?.id ?? senderId,
    });

    return message;
  }

  // =========================================
  // MIS CONVERSACIONES
  // =========================================

  @Get('my-conversations')
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @ApiOperation({
    summary: 'Obtener mis conversaciones',
    description: 'Devuelve todas las conversaciones del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversaciones del usuario',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  getMyConversations(@Req() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  // =========================================
  // LISTAR TODAS LAS CONVERSACIONES (ADMIN)
  // =========================================

  @Get('conversations')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Listar todas las conversaciones (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Lista completa de conversaciones' })
  @ApiForbiddenResponse({ description: 'Requiere rol Admin' })
  getConversationsAsAdmin() {
    return this.chatService.getConversationsAsAdmin();
  }

  // =========================================
  // OBTENER MENSAJES DE UNA CONVERSACIÓN
  // =========================================

  @Get('conversation/:id/messages')
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @ApiOperation({
    summary: 'Obtener mensajes de una conversación',
  })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiResponse({ status: 200, description: 'Lista de mensajes' })
  getMessages(@Param('id') id: string, @Req() req) {
    return this.chatService.getMessages(id, req.user.id);
  }

  // =========================================
  // OBTENER MENSAJES COMO ADMIN
  // =========================================

  @Get('admin/conversation/:id/messages')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener mensajes de una conversación (Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiForbiddenResponse({ description: 'Requiere rol Admin' })
  getMessagesAsAdmin(@Param('id') id: string, @Req() req) {
    return this.chatService.getMessagesAsAdmin(id, req.user.id);
  }

  // =========================================
  // CREAR CONVERSACIÓN DE SOPORTE
  // =========================================

  @Post('support')
  @ApiOperation({
    summary: 'Crear conversación de soporte',
    description:
      'Crea una conversación de soporte entre el usuario y el equipo administrador.',
  })
  @ApiResponse({ status: 201, description: 'Conversación de soporte creada' })
  createSupportConversation(
    @Req() req,
    @Body() body: { subject: string; detail: string },
  ) {
    return this.chatService.createSupportConversation(req.user.id, body);
  }

  // =========================================
  // BLOQUEAR CONVERSACIÓN (ADMIN)
  // =========================================

  @Patch(':id/block')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Bloquear conversación (Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  blockConversation(@Param('id') id: string) {
    return this.chatService.blockConversation(id);
  }

  // =========================================
  // DESBLOQUEAR CONVERSACIÓN (ADMIN)
  // =========================================

  @Patch(':id/unblock')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Desbloquear conversación (Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  unblockConversation(@Param('id') id: string) {
    return this.chatService.unblockConversation(id);
  }

  // =========================================
  // ELIMINAR CONVERSACIÓN (ADMIN)
  // =========================================

  @Delete('admin/conversation/:id')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Eliminar conversación (Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  deleteConversationAsAdmin(@Param('id') id: string) {
    return this.chatService.deleteConversationAsAdmin(id);
  }
}
