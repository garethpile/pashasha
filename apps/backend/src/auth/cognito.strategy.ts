import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { Jwt } from 'jsonwebtoken';

type CognitoJwtPayload = {
  sub: string;
  email?: string;
  phone_number?: string;
  'cognito:groups'?: string[];
  token_use: 'id' | 'access';
  client_id?: string;
  aud?: string;
};

type JwtExtractor = (
  req: { headers?: Record<string, unknown> } | null,
) => string | null;

type SecretProviderFn = (
  req: unknown,
  rawJwt: Jwt | undefined,
  done: (err: Error | null, key?: unknown) => void,
) => void;

type JwtStrategyOptions = {
  jwtFromRequest: JwtExtractor;
  ignoreExpiration: boolean;
  secretOrKeyProvider: SecretProviderFn;
  algorithms: string[];
  issuer: string;
};

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const userPoolId = process.env.USER_POOL_ID;
    const region =
      process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'eu-west-1';
    const clientId = process.env.USER_POOL_CLIENT_ID;

    if (!userPoolId) {
      throw new Error('USER_POOL_ID env var is required for Cognito auth');
    }

    if (!clientId) {
      throw new Error(
        'USER_POOL_CLIENT_ID env var is required for Cognito auth',
      );
    }

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    const jwtFromRequest: JwtExtractor = (
      req: { headers?: Record<string, unknown> } | null,
    ) => {
      const header = req?.headers?.authorization ?? req?.headers?.Authorization;
      if (typeof header !== 'string') {
        return null;
      }
      const match = header.match(/^Bearer\s+(.+)/i);
      return match?.[1] ?? null;
    };

    const jwksProviderCandidate = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: `${issuer}/.well-known/jwks.json`,
    });

    const isSecretProviderFn = (
      candidate: unknown,
    ): candidate is SecretProviderFn => typeof candidate === 'function';

    if (!isSecretProviderFn(jwksProviderCandidate)) {
      throw new Error('Invalid JWKS provider');
    }

    const jwksProvider: SecretProviderFn = jwksProviderCandidate;

    const secretOrKeyProvider: SecretProviderFn = (
      req: unknown,
      token: Jwt | undefined,
      done: (err: Error | null, key?: unknown) => void,
    ): void => {
      jwksProvider(req, token, done);
    };

    const strategyOptions: JwtStrategyOptions = {
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKeyProvider,
      algorithms: ['RS256'],
      issuer,
    };

    // passport-jwt constructor typing uses `any`; suppress unsafe call.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(strategyOptions);

    this.expectedClientId = clientId;
  }

  private readonly expectedClientId?: string;

  validate(payload: CognitoJwtPayload) {
    if (
      this.expectedClientId &&
      payload.client_id !== this.expectedClientId &&
      payload.aud !== this.expectedClientId
    ) {
      throw new UnauthorizedException('Invalid token audience');
    }

    if (payload.token_use !== 'access') {
      throw new UnauthorizedException('Invalid token use');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Token missing subject');
    }

    return payload;
  }
}
