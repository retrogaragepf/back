import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from 'src/users/dto/users.dto';
import { AuthGuard } from '@nestjs/passport';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signin')
  async signIn(@Body() credentials: LoginUserDto) {
    const { email, password } = credentials;
    return await this.authService.signIn(email, password);
  }

  @Post('signup')
  async signUp(@Body() newUserData: CreateUserDto) {
    return await this.authService.signUp(newUserData);
  }

  @Post('google')
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }
}
