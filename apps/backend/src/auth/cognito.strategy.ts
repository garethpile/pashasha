import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

type CognitoJwtPayload = {
  sub: string;
  email?: string;
  phone_number?: string;
  'cognito:groups'?: string[];
  token_use: 'id' | 'access';
  client_id?: string;
  aud?: string;
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

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
      algorithms: ['RS256'],
      issuer,
    });

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

    if (!payload.sub) {
      throw new UnauthorizedException('Token missing subject');
    }

    return payload;
  }
}
