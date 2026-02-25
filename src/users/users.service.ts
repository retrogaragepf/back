import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Users } from './entities/users.entity';
import { UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  async getAllUsers(): Promise<Omit<Users, 'password'>[]> {
    return await this.usersRepository.getAllUsers();
  }

  async getActiveUsers() {
    return this.usersRepository.getActiveUsers();
  }

  async getUserById(id: string): Promise<Omit<Users, 'password' | 'isAdmin'>> {
    return this.usersRepository.getUserById(id);
  }

  async updateUser(id: string, updateUserData: UpdateUserDto) {
    return await this.usersRepository.updateUser(id, updateUserData);
  }

  async updateMyAvatar(
    id: string,
    data: { avatarPublicId?: string | null; avatarUrl?: string | null },
  ) {
    return await this.usersRepository.updateMyAvatar(id, data);
  }

  async deleteUser(id: string) {
    return await this.usersRepository.deleteUser(id);
  }

  async blockUser(id: string) {
    return await this.usersRepository.blockUser(id);
  }

  async unblockUser(id: string) {
    return await this.usersRepository.unblockUser(id);
  }
}
