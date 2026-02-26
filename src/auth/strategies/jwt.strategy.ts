import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    type RequestWithAuthData = {
      headers?: { authorization?: string | string[] };
      cookies?: { token?: string; access_token?: string };
    };

    const extractTokenFromAuthorizationHeader = (
      req: RequestWithAuthData,
    ): string | null => {
      const authorizationHeader = req?.headers?.authorization;
      const value = Array.isArray(authorizationHeader)
        ? authorizationHeader[0]
        : authorizationHeader;
      if (!value || typeof value !== 'string') {
        return null;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      if (trimmed.toLowerCase().startsWith('bearer ')) {
        return trimmed.slice(7).trim();
      }
      return trimmed;
    };

    const extractTokenFromCookie = (req: RequestWithAuthData): string | null => {
      const cookieToken = req?.cookies?.token ?? req?.cookies?.access_token;
      if (!cookieToken || typeof cookieToken !== 'string') {
        return null;
      }
      return cookieToken.trim() || null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractTokenFromAuthorizationHeader,
        ExtractJwt.fromUrlQueryParameter('token'),
        extractTokenFromCookie,
      ]),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
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
