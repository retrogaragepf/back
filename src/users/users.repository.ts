import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/users.dto';
import { Cart } from 'src/carts/entities/cart.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users) private ormUsersRepository: Repository<Users>,
    @InjectRepository(Cart) private readonly cartsRepository: Repository<Cart>,
    private readonly dataSource: DataSource,
  ) {}

  async getAllUsers(): Promise<Omit<Users, 'password'>[]> {
    const allUsers = await this.ormUsersRepository.find({
      where: { isActive: true },
    });
    return allUsers.map(({ password, ...userNoPassword }) => userNoPassword);
  }

  async getActiveUsers() {
    return this.ormUsersRepository.find({
      where: { isActive: true },
    });
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
    return await this.ormUsersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();
  }

  async addUser(newUserData: CreateUserDto): Promise<Users> {
    return await this.dataSource.transaction(async (manager) => {
      const user = manager.create(Users, {
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password,
        provider: 'local',
        isActive: true,
        isAdmin: false,
      });
      const savedUser = await manager.save(user);
      const cart = manager.create(Cart, { user: savedUser });
      await manager.save(cart);
      return savedUser;
    });
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
      isActive: true,
      isAdmin: false,
    });
    const savedUser = await this.ormUsersRepository.save(user);
    const cart = this.cartsRepository.create({
      user: savedUser,
    });
    await this.cartsRepository.save(cart);
    return savedUser;
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
  async blockUser(id: string): Promise<{ id: string; isBlocked: true }> {
    const user = await this.ormUsersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
    user.isBlocked = true;
    await this.ormUsersRepository.save(user);
    return { id: user.id, isBlocked: true };
  }

  async unblockUser(id: string): Promise<{ id: string; isBlocked: false }> {
    const user = await this.ormUsersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
    user.isBlocked = false;
    await this.ormUsersRepository.save(user);
    return { id: user.id, isBlocked: false };
  }
}
