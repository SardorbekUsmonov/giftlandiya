import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Use with @Public() so global JwtAuthGuard is bypassed,
// then this guard attempts JWT parsing but never throws on failure.
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
