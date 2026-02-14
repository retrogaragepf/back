import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.log('JWT_SECRET EN STRATEGY:', process.env.JWT_SECRET);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    console.log('PAYLOAD RECIBIDO EN VALIDATE:', payload);

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      isAdmin: payload.isAdmin,
      isBlocked: payload.isBlocked,
      roles: payload.isAdmin ? ['Admin'] : ['user'],
    };
  }
}
