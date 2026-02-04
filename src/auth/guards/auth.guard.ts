import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeaders = request.headers['authorization'];
    if (!authHeaders) return false;
    const auth = authHeaders.split(' ')[1];
    if (!auth) return false;
    const [email, password] = auth.split(':');
    if (!email || !password) return false;
    return true;
  }
}
