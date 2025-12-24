import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { CivilServantsService } from './civil-servants.service';
import { Roles } from '../auth/roles.decorator';
import { CreateCivilServantDto } from './dto/create-civil-servant.dto';
import { UpdateCivilServantDto } from './dto/update-civil-servant.dto';
import { CivilServantSearchQueryDto } from './dto/civil-servant-search-query.dto';
import { CivilServantLookupQueryDto } from './dto/civil-servant-lookup-query.dto';
import { CivilServantTransactionsQueryDto } from './dto/civil-servant-transactions-query.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from '../payments/payments.service';
import { KycService } from '../kyc/kyc.service';
import { KycPresignDto } from '../kyc/dto/kyc-presign.dto';
import { KycConfirmDto } from '../kyc/dto/kyc-confirm.dto';
import { assertKycDocumentType, type KycDocumentType } from '../kyc/kyc.types';
import type { Response } from 'express';

@Controller('civil-servants')
export class CivilServantsController {
  constructor(
    private readonly service: CivilServantsService,
    private readonly payments: PaymentsService,
    private readonly kyc: KycService,
  ) {}

  @Roles('Administrators')
  @Post()
  create(@Body() dto: CreateCivilServantDto) {
    return this.service.create(dto);
  }

  @Roles('Administrators')
  @Get()
  search(@Query() query: CivilServantSearchQueryDto) {
    return this.service.search(query.accountNumber, query.familyName);
  }

  @Roles('Customers', 'Administrators')
  @Get('lookup')
  lookup(@Query() query: CivilServantLookupQueryDto) {
    return this.service.searchForCustomers({
      firstName: query.firstName,
      familyName: query.familyName,
      occupation: query.occupation,
      site: query.site,
    });
  }

  @Get('me')
  getMe(@CurrentUser() user: { sub: string }) {
    return this.service.findByUser(user.sub);
  }

  @Get('me/transactions')
  async getMyTransactions(
    @CurrentUser() user: { sub: string },
    @Query() query: CivilServantTransactionsQueryDto,
  ) {
    const civilServant = await this.service.findByUser(user.sub);
    if (!civilServant.eclipseWalletId) {
      return [];
    }
    const parsedLimit = query.limit ?? 20;
    const parsedOffset = query.offset ?? 0;
    return this.payments.listByWalletId(
      civilServant.eclipseWalletId,
      Number.isNaN(parsedLimit) ? 20 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
      { statusFilter: 'all' },
    );
  }

  @Get('me/transactions/pending')
  async getMyPendingTransactions(
    @CurrentUser() user: { sub: string },
    @Query() query: CivilServantTransactionsQueryDto,
  ) {
    const civilServant = await this.service.findByUser(user.sub);
    if (!civilServant.eclipseWalletId) {
      return [];
    }
    const parsedLimit = query.limit ?? 20;
    const parsedOffset = query.offset ?? 0;
    return this.payments.listByWalletId(
      civilServant.eclipseWalletId,
      Number.isNaN(parsedLimit) ? 20 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
      { statusFilter: 'pending' },
    );
  }

  @Roles('Administrators')
  @Get(':civilServantId')
  findOne(@Param('civilServantId') civilServantId: string) {
    return this.service.findOne(civilServantId);
  }

  @Roles('Administrators')
  @Get(':civilServantId/transactions')
  async getTransactions(@Param('civilServantId') civilServantId: string) {
    const civilServant = await this.service.findOne(civilServantId);
    if (!civilServant.eclipseWalletId) {
      return [];
    }
    return this.payments.listByWalletId(civilServant.eclipseWalletId, 20, 0, {
      statusFilter: 'all',
    });
  }

  @Roles('Administrators')
  @Get(':civilServantId/transactions/pending')
  async getPendingTransactions(
    @Param('civilServantId') civilServantId: string,
    @Query() query: CivilServantTransactionsQueryDto,
  ) {
    const civilServant = await this.service.findOne(civilServantId);
    if (!civilServant.eclipseWalletId) {
      return [];
    }
    const parsedLimit = query.limit ?? 10;
    const parsedOffset = query.offset ?? 0;
    return this.payments.listByWalletId(
      civilServant.eclipseWalletId,
      Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
      { statusFilter: 'pending' },
    );
  }

  @Put('me')
  updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateCivilServantDto,
  ) {
    return this.service.updateSelf(user.sub, dto);
  }

  @Roles('Administrators')
  @Put(':civilServantId')
  update(
    @Param('civilServantId') civilServantId: string,
    @Body() dto: UpdateCivilServantDto,
  ) {
    return this.service.update(civilServantId, dto);
  }

  // Self-service endpoints rely on authenticated identity; ownership is enforced in the service.
  @Get('me/kyc')
  getMyKyc(@CurrentUser() user: { sub: string }) {
    return this.kyc.getKyc('civil-servant', user.sub);
  }

  @Post('me/kyc/documents/:documentType/presign')
  presignMyKyc(
    @CurrentUser() user: { sub: string },
    @Param('documentType') documentType: string,
    @Body() dto: KycPresignDto,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.createPresignedUpload(
      'civil-servant',
      user.sub,
      parsed,
      dto.contentType,
      dto.fileName,
      dto.size,
    );
  }

  @Post('me/kyc/documents/:documentType/confirm')
  confirmMyKyc(
    @CurrentUser() user: { sub: string },
    @Param('documentType') documentType: string,
    @Body() dto: KycConfirmDto,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.confirmUpload('civil-servant', user.sub, parsed, {
      bucket: dto.bucket,
      key: dto.key,
      contentType: dto.contentType,
      fileName: dto.fileName,
      size: dto.size,
    });
  }

  @Get('me/kyc/documents/:documentType')
  getMyKycDocument(
    @CurrentUser() user: { sub: string },
    @Param('documentType') documentType: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc
      .getDocument('civil-servant', user.sub, parsed)
      .then((doc) => {
        res.setHeader('Content-Type', doc.contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (doc.contentLength !== undefined) {
          res.setHeader('Content-Length', String(doc.contentLength));
        }
        if (doc.fileName) {
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${doc.fileName.replace(/"/g, '')}"`,
          );
        }
        return new StreamableFile(doc.stream);
      });
  }

  @Delete('me/kyc/documents/:documentType')
  deleteMyKycDocument(
    @CurrentUser() user: { sub: string },
    @Param('documentType') documentType: string,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.deleteDocument('civil-servant', user.sub, parsed);
  }

  @Roles('Administrators')
  @Delete(':civilServantId')
  remove(@Param('civilServantId') civilServantId: string) {
    return this.service.remove(civilServantId);
  }

  @Roles('Administrators')
  @Get(':civilServantId/kyc')
  getKyc(@Param('civilServantId') civilServantId: string) {
    return this.kyc.getKyc('civil-servant', civilServantId);
  }

  @Roles('Administrators')
  @Post(':civilServantId/kyc/documents/:documentType/presign')
  presignKyc(
    @Param('civilServantId') civilServantId: string,
    @Param('documentType') documentType: string,
    @Body() dto: KycPresignDto,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.createPresignedUpload(
      'civil-servant',
      civilServantId,
      parsed,
      dto.contentType,
      dto.fileName,
    );
  }

  @Roles('Administrators')
  @Post(':civilServantId/kyc/documents/:documentType/confirm')
  confirmKyc(
    @Param('civilServantId') civilServantId: string,
    @Param('documentType') documentType: string,
    @Body() dto: KycConfirmDto,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.confirmUpload('civil-servant', civilServantId, parsed, {
      bucket: dto.bucket,
      key: dto.key,
      contentType: dto.contentType,
      fileName: dto.fileName,
      size: dto.size,
    });
  }

  @Roles('Administrators')
  @Get(':civilServantId/kyc/documents/:documentType')
  getKycDocument(
    @Param('civilServantId') civilServantId: string,
    @Param('documentType') documentType: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc
      .getDocument('civil-servant', civilServantId, parsed)
      .then((doc) => {
        res.setHeader('Content-Type', doc.contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (doc.contentLength !== undefined) {
          res.setHeader('Content-Length', String(doc.contentLength));
        }
        if (doc.fileName) {
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${doc.fileName.replace(/"/g, '')}"`,
          );
        }
        return new StreamableFile(doc.stream);
      });
  }

  @Roles('Administrators')
  @Delete(':civilServantId/kyc/documents/:documentType')
  deleteKycDocument(
    @Param('civilServantId') civilServantId: string,
    @Param('documentType') documentType: string,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.deleteDocument('civil-servant', civilServantId, parsed);
  }

  @Get('me/qr-code')
  getMyQrCode(@CurrentUser() user: { sub: string }) {
    return this.service.getQrCodeForUser(user.sub);
  }

  @Get('me/payout')
  getPayoutInfo(@CurrentUser() user: { sub: string }) {
    return this.service.getPayoutInfo(user.sub);
  }

  @Post('me/payout')
  async requestPayout(
    @CurrentUser() user: { sub: string },
    @Body()
    body: { amount: number; method: 'ATM_CASH' | 'PNP_CASH' | 'PNP_SPEND' },
  ) {
    const typeMap: Record<string, string> = {
      ATM_CASH: 'ZA_PAYCORP_ATM',
      PNP_CASH: 'ZA_PNP_CASH',
      PNP_SPEND: 'ZA_PNP_CASH',
    };
    const method = body?.method;
    const mapped = method ? typeMap[method] : undefined;
    if (!mapped) {
      throw new Error('Unsupported payout method');
    }
    const amount = Number(body?.amount ?? 0);
    return this.service.withdraw(user.sub, amount, mapped);
  }

  @Roles('Administrators')
  @Post(':civilServantId/guard-token')
  regenerateToken(@Param('civilServantId') civilServantId: string) {
    return this.service.regenerateGuardToken(civilServantId);
  }

  @Roles('Administrators')
  @Get(':civilServantId/qr-code')
  getQrCode(@Param('civilServantId') civilServantId: string) {
    return this.service.getQrCodeUrl(civilServantId);
  }

  @Roles('Administrators')
  @Get(':civilServantId/payout')
  getPayoutInfoForAdmin(@Param('civilServantId') civilServantId: string) {
    return this.service.getPayoutInfo(civilServantId);
  }
}
