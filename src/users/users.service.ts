import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  async getAllUsers(
    page: number,
    limit: number,
  ): Promise<Omit<Users, 'password'>[]> {
    return await this.usersRepository.getAllUsers(page, limit);
  }

  async getUserById(id: string) {
    return await this.usersRepository.getUserById(id);
  }

  async addUser(newUserData: CreateUserDto) {
    return await this.usersRepository.addUser(newUserData);
  }

  async updateUser(id: string, updateUserData: any) {
    return await this.usersRepository.updateUser(id, updateUserData);
  }

  async deleteUser(id: string) {
    return await this.usersRepository.deleteUser(id);
  }
}
