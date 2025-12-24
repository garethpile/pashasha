import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateTipIntentDto } from './dto/create-tip-intent.dto';
import { GuardsService } from './guards.service';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { CreateSandboxTopupDto } from './dto/create-sandbox-topup.dto';

@Controller('guards')
export class GuardsController {
  constructor(private readonly guardsService: GuardsService) {}

  @Public()
  @Throttle({ short: { limit: 30, ttl: 60 }, qr: { limit: 20, ttl: 60 } })
  @Get(':token')
  getGuardByToken(@Param('token') token: string) {
    return this.guardsService.findGuardByToken(token);
  }

  @Public()
  @Throttle({ short: { limit: 20, ttl: 60 } })
  @Post(':token/tips')
  @HttpCode(HttpStatus.CREATED)
  createTipIntent(
    @Param('token') token: string,
    @Body() dto: CreateTipIntentDto,
  ) {
    return this.guardsService.createTipIntent({
      ...dto,
      guardToken: token,
    });
  }

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60 } })
  @Post(':token/topup-sandbox')
  @HttpCode(HttpStatus.CREATED)
  createSandboxTopup(
    @Param('token') token: string,
    @Body() dto: CreateSandboxTopupDto,
  ) {
    return this.guardsService.createSandboxTopup(token, dto);
  }

  // Minimal stub endpoint to validate connectivity without touching downstream services.
  @Public()
  @Post(':token/topup-sandbox/stub')
  @HttpCode(HttpStatus.CREATED)
  stubSandboxTopup(@Param('token') token: string) {
    return {
      paymentId: `stub_${token}`,
      status: 'initiated',
      authorizationUrl: null,
      raw: { note: 'static sandbox topup stub' },
    };
  }

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60 } })
  @Get(':token/qr')
  async getGuardQrCode(@Param('token') token: string, @Res() res: Response) {
    const { buffer, landingUrl } =
      await this.guardsService.generateGuardQrCode(token);
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300',
      'X-Guard-Landing-Url': landingUrl,
      // Allow the QR image to be embedded when the frontend is served from a different domain
      // (e.g., CloudFront domain versus API domain).
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(buffer);
  }

  @Throttle({ qr: { limit: 3, ttl: 300 } })
  @Post(':token/rotate')
  async rotateGuardToken(@Param('token') token: string) {
    return this.guardsService.rotateGuardToken(token);
  }
}
