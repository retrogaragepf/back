import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users/users.repository';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}
  getAuth() {
    return 'Auth';
  }

  async signIn(email: string, password: string) {
    if (!email || !password) return 'Email y password son requeridos';
    const foundUser = await this.usersRepository.getUserByEmail(email);
    if (!foundUser || foundUser.password !== password)
      return `Email o password incorrectos`;
    return 'Usuario logueado (TOKEN)';
  }
}
