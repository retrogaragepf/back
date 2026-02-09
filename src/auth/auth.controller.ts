import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from 'src/users/dto/users.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  async signIn(@Body() credentials: LoginUserDto) {
    const { email, password } = credentials;
    return await this.authService.signIn(email, password);
  }

  @Post('signup')
  async signUp(@Body() newUserData: CreateUserDto) {
    return await this.authService.signUp(newUserData);
  }
}
