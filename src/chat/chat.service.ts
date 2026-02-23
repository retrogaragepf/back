import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { In, Not, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { CreateConversationDto } from './dto/conversation.dto';
import { Users } from 'src/users/entities/users.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(ConversationParticipant)
    private participantRepo: Repository<ConversationParticipant>,
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
  ) {}

  async createConversation(dto: CreateConversationDto) {
    const { type, participantIds } = dto;
    const users = await this.usersRepo.findBy({
      id: In(participantIds),
    });
    if (users.length !== participantIds.length) {
      throw new BadRequestException('Algunos usuarios no existen');
    }
    if (type === 'PRIVATE' && participantIds.length === 2) {
      const existingConversation = await this.conversationRepo
        .createQueryBuilder('conversation')
        .innerJoin('conversation.participants', 'participant')
        .where('conversation.type = :type', { type: 'PRIVATE' })
        .andWhere('participant.userId IN (:...ids)', {
          ids: participantIds,
        })
        .groupBy('conversation.id')
        .having('COUNT(participant.id) = 2')
        .getOne();
      if (existingConversation) {
        return existingConversation;
      }
    }
    const conversation = this.conversationRepo.create({ type });
    await this.conversationRepo.save(conversation);
    for (const userId of participantIds) {
      const participant = this.participantRepo.create({
        conversation,
        user: { id: userId },
      });
      await this.participantRepo.save(participant);
    }
    return conversation;
  }

  async createMessage(senderId: string, dto: CreateMessageDto) {
    const { conversationId, content } = dto;
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }
    if (!conversation.isActive) {
      throw new ForbiddenException('Esta conversacion fue eliminada');
    }
    if (conversation.isBlocked) {
      throw new ForbiddenException('Esta conversacion esta bloqueada');
    }
    const isParticipant = await this.isUserInConversation(
      senderId,
      conversationId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('No perteneces a esta conversacion');
    }
    const message = this.messageRepo.create({
      content,
      conversation: { id: conversationId } as Conversation,
      sender: { id: senderId } as Users,
    });
    const savedMessage = await this.messageRepo.save(message);
    const fullMessage = await this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });
    return fullMessage;
  }

  async isUserInConversation(userId: string, conversationId: string) {
    const participant = await this.participantRepo.findOne({
      where: {
        userId,
        conversationId,
      },
    });
    return !!participant;
  }

  async getUserConversations(userId: string) {
    return this.participantRepo.find({
      where: {
        user: { id: userId },
        conversation: { isActive: true },
      },
      relations: ['conversation'],
    });
  }

  async getMessages(conversationId: string, userId: string) {
    const participant = await this.participantRepo.findOne({
      where: { userId, conversationId },
      relations: ['conversation', 'user'],
    });
    if (!participant) {
      throw new ForbiddenException('No perteneces a esta conversacion');
    }
    if (!participant.conversation?.isActive) {
      throw new NotFoundException('Conversacion no encontrada');
    }
    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
    await this.messageRepo.update(
      {
        conversation: { id: conversationId },
        sender: { id: Not(userId) },
        isRead: false,
      },
      { isRead: true },
    );
    return messages;
  }

  async getMessagesAsAdmin(conversationId: string, adminId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, isActive: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }
    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
    await this.messageRepo.update(
      {
        conversation: { id: conversationId },
        sender: { id: Not(adminId) },
        isRead: false,
      },
      { isRead: true },
    );
    return messages;
  }

  async findPrivateConversation(userId1: string, userId2: string) {
    return this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin(
        'conversation_participant',
        'cp1',
        'cp1.conversationId = conversation.id',
      )
      .innerJoin(
        'conversation_participant',
        'cp2',
        'cp2.conversationId = conversation.id',
      )
      .where('conversation.type = :type', { type: 'PRIVATE' })
      .andWhere('cp1.userId = :userId1', { userId1 })
      .andWhere('cp2.userId = :userId2', { userId2 })
      .getOne();
  }

  async createSupportConversation(
    userId: string,
    body: { subject: string; detail: string },
  ) {
    const admin = await this.usersRepo.findOne({
      where: { isSupportAdmin: true },
    });
    if (!admin) {
      throw new NotFoundException('No hay administrador de soporte disponible');
    }
    const existingConversation = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1')
      .innerJoin('conversation.participants', 'p2')
      .where('conversation.type = :type', { type: 'SUPPORT' })
      .andWhere('conversation.isActive = true')
      .andWhere('p1.userId = :userId', { userId })
      .andWhere('p2.userId = :adminId', { adminId: admin.id })
      .getOne();
    let conversation = existingConversation;
    if (!conversation) {
      conversation = this.conversationRepo.create({
        type: 'SUPPORT',
        isActive: true,
        isBlocked: false,
      });
      await this.conversationRepo.save(conversation);
      const participants = [
        this.participantRepo.create({
          conversation,
          user: { id: userId },
        }),
        this.participantRepo.create({
          conversation,
          user: { id: admin.id },
        }),
      ];
      await this.participantRepo.save(participants);
    }
    const message = this.messageRepo.create({
      content: `Asunto: ${body.subject}\n\n${body.detail}`,
      conversation: { id: conversation.id } as Conversation,
      sender: { id: userId } as Users,
    });
    await this.messageRepo.save(message);
    return conversation;
  }

  async blockConversation(id: string) {
    const conversation = await this.conversationRepo.findOneBy({ id });
    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }
    conversation.isBlocked = true;
    await this.conversationRepo.save(conversation);
    return { message: 'Conversacion bloqueada correctamente' };
  }

  async deleteConversation(id: string, userId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id },
    });
    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }
    const isParticipant = await this.isUserInConversation(userId, id);
    if (!isParticipant) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta conversacion',
      );
    }
    conversation.isActive = false;
    await this.conversationRepo.save(conversation);
    return { message: 'Conversacion eliminada correctamente' };
  }

  async deleteConversationAsAdmin(id: string) {
    const conversation = await this.conversationRepo.findOneBy({ id });
    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }
    conversation.isActive = false;
    await this.conversationRepo.save(conversation);
    return { message: 'Conversacion eliminada correctamente por admin' };
  }
}
