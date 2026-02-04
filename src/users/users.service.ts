import { Injectable } from '@nestjs/common';
import { User, UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  async getAllUsers(
    page: number,
    limit: number,
  ): Promise<Omit<User, 'password'>[]> {
    return await this.usersRepository.getAllUsers(page, limit);
  }

  async getUserById(id: string) {
    return await this.usersRepository.getUserById(id);
  }

  async addUser(newUserData: any) {
    return await this.usersRepository.addUser(newUserData);
  }

  async updateUser(id: string, updateUserData: any) {
    return await this.usersRepository.updateUser(id, updateUserData);
  }

  async deleteUser(id: string) {
    return await this.usersRepository.deleteUser(id);
  }
}
