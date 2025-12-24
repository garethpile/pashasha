import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AuthenticatedRequest<T = Record<string, unknown>> = {
  user?: T;
};

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): Record<string, unknown> | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<AuthenticatedRequest<Record<string, unknown>>>();
    return request.user;
  },
);
