import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Inject } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      console.log('Usuario conectado:', payload.sub);
    } catch (error) {
      console.log('Error de autenticación WS');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  private extractConversationId(
    payload: string | { conversationId?: string },
  ): string | null {
    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }
    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.conversationId === 'string' &&
      payload.conversationId.trim().length > 0
    ) {
      return payload.conversationId;
    }
    return null;
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    client: Socket,
    payload: string | { conversationId?: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }
    const conversationId = this.extractConversationId(payload);
    if (!conversationId) {
      throw new WsException('conversationId es obligatorio');
    }
    const isParticipant = await this.chatService.isUserInConversation(
      user.sub,
      conversationId,
    );
    if (!isParticipant) {
      console.log(
        `Usuario ${user.sub} intentó unirse a conversación no permitida`,
      );
      throw new WsException('No perteneces a esta conversación');
      return;
    }
    client.join(conversationId);
    console.log(
      `Usuario ${user.sub} se unió a la conversación ${conversationId}`,
    );
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { conversationId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    const message = await this.chatService.createMessage(user.sub, payload);
    if (!message) {
      throw new WsException('No se pudo crear el mensaje');
    }
    const eventPayload = {
      id: message.id,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: message.sender,
      conversationId: payload.conversationId,
      senderId: user.sub,
    };
    this.server.to(payload.conversationId).emit('newMessage', eventPayload);
    return message;
  }
}
