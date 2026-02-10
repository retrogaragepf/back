import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from 'src/users/dto/users.dto';
import { AuthGuard } from '@nestjs/passport';

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirige a Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req) {
    return this.authService.googleLogin(req.user);
  }
}
