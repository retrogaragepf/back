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
import { forwardRef, Inject } from '@nestjs/common';

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
    @Inject(forwardRef(() => ChatService))
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

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(client: Socket, conversationId: string) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
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
}
