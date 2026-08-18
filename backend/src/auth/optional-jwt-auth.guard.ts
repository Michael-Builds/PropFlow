import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | undefined, user: TUser): TUser | undefined {
    if (err) return undefined;
    return user ?? undefined;
  }
}
