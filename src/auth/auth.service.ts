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
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) { }

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
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async googleLogin(googleLoginDto: { idToken: string }) {
    // 1. Verificar el token con Google
    const ticket = await this.googleClient.verifyIdToken({
      idToken: googleLoginDto.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const { email, name, sub: googleId } = payload;

    // 2. Buscar usuario en la DB
    let user = await this.usersRepository.getUserByEmail(email);

    // 3. Si no existe, crearlo
    if (!user) {
      // Nota: Aquí asumo que existe un método para crear usuario sin password o que addUser lo permite.
      // Si `addUser` requiere password, habrá que ajustar el repositorio o pasar un password dummy/null si la entidad lo permite.
      // Dado que el spec dice "password: null", vamos a intentar pasarlo así.
      // Sin embargo, `addUser` en el servicio actual usa `CreateUserDto` que podría requerir password.
      // Voy a usar `addGoogleUser` que ya existía en el código original, pero ajustándolo si es necesario.

      user = await this.usersRepository.addGoogleUser({
        email,
        name: name || '',
        providerId: googleId,
      });
    }

    // 4. Generar JWT (mismo formato que signIn)
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
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
