import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { UsersRepository } from 'src/users/users.repository';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/users.dto';
import { JwtService } from '@nestjs/jwt';
import { Users } from 'src/users/entities/users.entity';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

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
    await this.emailService.sendWelcomeEmail(email, newUserData.name);
    return { id: user.id };
  }

  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async googleLogin(googleLoginDto: { idToken: string }) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: googleLoginDto.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token de Google inválido');
    }
    const { email, name, sub: googleId } = payload;
    let user = await this.usersRepository.getUserByEmail(email);
    if (!user) {
      user = await this.usersRepository.addGoogleUser({
        email,
        name: name || '',
        providerId: googleId,
      });
      await this.emailService.sendWelcomeEmail(email, name || 'User');
    }
    return this.generateJwt(user);
  }

  private generateJwt(user: Users) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
