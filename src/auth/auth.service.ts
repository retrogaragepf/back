import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from 'src/users/users.repository';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/users.dto';
import { JwtService } from '@nestjs/jwt';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  /* ================= LOGIN LOCAL ================= */
  async signIn(email: string, password: string) {
    const user = await this.usersRepository.getUserByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email o password incorrectos');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Este usuario debe iniciar sesión con Google',
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('Email o password incorrectos');
    }

    return this.generateJwt(user);
  }

  /* ================= REGISTRO LOCAL ================= */
  async signUp(newUserData: CreateUserDto): Promise<{ id: string }> {
    const { email, password } = newUserData;

    if (!email || !password) {
      throw new BadRequestException('Email y password son requeridos');
    }

    const existingUser = await this.usersRepository.getUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email ya se encuentra registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersRepository.addUser({
      ...newUserData,
      password: hashedPassword,
    });

    // 👇 SOLO devuelve id
    return { id: user.id };
  }

  /* ================= GOOGLE LOGIN / SIGNUP ================= */
  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    providerId: string;
  }) {
    let user = await this.usersRepository.getUserByEmail(googleUser.email);

    if (!user) {
      user = await this.usersRepository.addGoogleUser({
        email: googleUser.email,
        name: `${googleUser.firstName} ${googleUser.lastName}`,
        providerId: googleUser.providerId,
      });
    }

    // 👇 Google SIEMPRE autentica
    return this.generateJwt(user);
  }

  /* ================= JWT ================= */
  private generateJwt(user: Users) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    return {
      message: 'Usuario autenticado',
      token: this.jwtService.sign(payload),
    };
  }
}
