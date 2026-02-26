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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

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
      console.log('Usuario conectado:', payload.id);
    } catch (error) {
      console.log('Error de autenticacion WS');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  private extractConversationId(
    payload: string | { conversationId?: string; id?: string },
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
    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.id === 'string' &&
      payload.id.trim().length > 0
    ) {
      return payload.id;
    }
    return null;
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    client: Socket,
    payload: string | { conversationId?: string; id?: string },
  ) {
    const user = client.data.user;
    if (!user?.id) {
      client.disconnect();
      return;
    }
    const conversationId = this.extractConversationId(payload);
    if (!conversationId) {
      throw new WsException('conversationId es obligatorio');
    }
    const isParticipant = await this.chatService.isUserInConversation(
      user.id,
      conversationId,
    );
    if (!isParticipant) {
      console.log(
        `Usuario ${user.id} intento unirse a conversacion no permitida`,
      );
      throw new WsException('No perteneces a esta conversacion');
    }
    client.join(conversationId);
    console.log(`Usuario ${user.id} se unio a la conversacion ${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { conversationId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user?.id) {
      client.disconnect();
      return;
    }

    const message = await this.chatService.createMessage(user.id, payload);
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
      senderId: message.sender?.id ?? user.id,
    };
    this.server.to(payload.conversationId).emit('newMessage', eventPayload);
    return message;
  }
}
