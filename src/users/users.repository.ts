import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/users.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users) private ormUsersRepository: Repository<Users>,
  ) {}

  async getAllUsers(
    page: number,
    limit: number,
  ): Promise<Omit<Users, 'password'>[]> {
    const skip = (page - 1) * limit;
    const allUsers = await this.ormUsersRepository.find({
      where: { isActive: true },
      skip: skip,
      take: limit,
    });
    return allUsers.map(({ password, ...userNoPassword }) => userNoPassword);
  }

  async getUserById(id: string): Promise<Omit<Users, 'password' | 'isAdmin'>> {
    const foundUser = await this.ormUsersRepository.findOne({
      where: { id, isActive: true },
    });
    if (!foundUser)
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    const { password, isAdmin, ...filteredUser } = foundUser;
    return filteredUser;
  }

  async getUserByEmail(email: string): Promise<Users | null> {
    return await this.ormUsersRepository.findOneBy({ email, isActive: true });
  }

  async addUser(newUserData: CreateUserDto): Promise<Users> {
    const user = this.ormUsersRepository.create({
      name: newUserData.name,
      email: newUserData.email,
      password: newUserData.password,
      provider: 'local',
      isActive: true,
      isAdmin: false,
    });
    return await this.ormUsersRepository.save(user);
  }

  async addGoogleUser(data: {
    name: string;
    email: string;
    providerId: string;
  }): Promise<Users> {
    const user = this.ormUsersRepository.create({
      name: data.name,
      email: data.email,
      password: null,
      provider: 'google',
      providerId: data.providerId,
    });

    return await this.ormUsersRepository.save(user);
  }

  async updateUser(
    id: string,
    newUserData: Users,
  ): Promise<Omit<Users, 'password'> | string> {
    const user = await this.ormUsersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
    const mergedUser = this.ormUsersRepository.merge(user, newUserData);
    const savedUser = await this.ormUsersRepository.save(mergedUser);
    const { password, ...userNoPassword } = savedUser;
    return userNoPassword;
  }

  async deleteUser(id: string) {
    const foundUser = await this.ormUsersRepository.findOneBy({
      id,
      isActive: true,
    });
    if (!foundUser)
      throw new NotFoundException(`No existe usuario activo con id ${id}`);
    foundUser.isActive = false;
    await this.ormUsersRepository.save(foundUser);
    return {
      message: 'Usuario eliminado exitosamente',
      id: foundUser.id,
    };
  }
}
