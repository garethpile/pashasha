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
import { CustomersService } from './customers.service';
import { Roles } from '../auth/roles.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerSearchQueryDto } from './dto/customer-search-query.dto';
import { CustomerTransactionsQueryDto } from './dto/customer-transactions-query.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { KycService } from '../kyc/kyc.service';
import { KycPresignDto } from '../kyc/dto/kyc-presign.dto';
import { KycConfirmDto } from '../kyc/dto/kyc-confirm.dto';
import { assertKycDocumentType, type KycDocumentType } from '../kyc/kyc.types';
import type { Response } from 'express';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly kyc: KycService,
  ) {}

  @Roles('Administrators')
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Roles('Administrators')
  @Get()
  search(@Query() query: CustomerSearchQueryDto) {
    return this.customersService.search(query.accountNumber, query.familyName);
  }

  @Roles('Customers')
  @Get('me')
  getMe(@CurrentUser() user: { sub: string }) {
    return this.customersService.findByUser(user.sub);
  }

  @Roles('Customers')
  @Get('me/transactions')
  getMyTransactions(
    @CurrentUser() user: { sub: string },
    @Query() query: CustomerTransactionsQueryDto,
  ) {
    const parsedLimit = query.limit ?? 20;
    const parsedOffset = query.offset ?? 0;
    return this.customersService.listTransactions(
      user.sub,
      Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
    );
  }

  @Roles('Customers')
  @Get('me/transactions/sent')
  async getMySentTransactions(
    @CurrentUser() user: { sub: string },
    @Query() query: CustomerTransactionsQueryDto,
  ) {
    const parsedLimit = query.limit ?? 20;
    const parsedOffset = query.offset ?? 0;
    return this.customersService.listSentTransactions(
      user.sub,
      Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
    );
  }

  @Roles('Customers')
  @Get('me/wallet')
  getMyWallet(@CurrentUser() user: { sub: string }) {
    return this.customersService.getWalletInfo(user.sub);
  }

  @Roles('Customers')
  @Put('me')
  updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateSelf(user.sub, dto);
  }

  @Roles('Customers')
  @Get('me/kyc')
  getMyKyc(@CurrentUser() user: { sub: string }) {
    return this.kyc.getKyc('customer', user.sub);
  }

  @Roles('Customers')
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
      'customer',
      user.sub,
      parsed,
      dto.contentType,
      dto.fileName,
      dto.size,
    );
  }

  @Roles('Customers')
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
    return this.kyc.confirmUpload('customer', user.sub, parsed, {
      bucket: dto.bucket,
      key: dto.key,
      contentType: dto.contentType,
      fileName: dto.fileName,
      size: dto.size,
    });
  }

  @Roles('Customers')
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
    return this.kyc.getDocument('customer', user.sub, parsed).then((doc) => {
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

  @Roles('Customers')
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
    return this.kyc.deleteDocument('customer', user.sub, parsed);
  }

  @Roles('Administrators')
  @Get(':customerId')
  findOne(@Param('customerId') customerId: string) {
    return this.customersService.findOne(customerId);
  }

  @Roles('Administrators')
  @Get(':customerId/transactions')
  getTransactions(
    @Param('customerId') customerId: string,
    @Query() query: CustomerTransactionsQueryDto,
  ) {
    const parsedLimit = query.limit ?? 10;
    const parsedOffset = query.offset ?? 0;
    return this.customersService.listTransactions(
      customerId,
      Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
    );
  }

  @Roles('Administrators')
  @Get(':customerId/transactions/pending')
  getPendingTransactions(
    @Param('customerId') customerId: string,
    @Query() query: CustomerTransactionsQueryDto,
  ) {
    const parsedLimit = query.limit ?? 10;
    const parsedOffset = query.offset ?? 0;
    return this.customersService.listTransactions(
      customerId,
      Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      Number.isNaN(parsedOffset) ? 0 : parsedOffset,
      { statusFilter: 'pending' },
    );
  }

  @Roles('Administrators')
  @Get(':customerId/wallet')
  getWallet(@Param('customerId') customerId: string) {
    return this.customersService.getWalletInfo(customerId);
  }

  @Roles('Administrators')
  @Get(':customerId/kyc')
  getKyc(@Param('customerId') customerId: string) {
    return this.kyc.getKyc('customer', customerId);
  }

  @Roles('Administrators')
  @Post(':customerId/kyc/documents/:documentType/presign')
  presignKyc(
    @Param('customerId') customerId: string,
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
      'customer',
      customerId,
      parsed,
      dto.contentType,
      dto.fileName,
    );
  }

  @Roles('Administrators')
  @Post(':customerId/kyc/documents/:documentType/confirm')
  confirmKyc(
    @Param('customerId') customerId: string,
    @Param('documentType') documentType: string,
    @Body() dto: KycConfirmDto,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.confirmUpload('customer', customerId, parsed, {
      bucket: dto.bucket,
      key: dto.key,
      contentType: dto.contentType,
      fileName: dto.fileName,
      size: dto.size,
    });
  }

  @Roles('Administrators')
  @Get(':customerId/kyc/documents/:documentType')
  getKycDocument(
    @Param('customerId') customerId: string,
    @Param('documentType') documentType: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.getDocument('customer', customerId, parsed).then((doc) => {
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
  @Delete(':customerId/kyc/documents/:documentType')
  deleteKycDocument(
    @Param('customerId') customerId: string,
    @Param('documentType') documentType: string,
  ) {
    let parsed: KycDocumentType;
    try {
      parsed = assertKycDocumentType(documentType);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    return this.kyc.deleteDocument('customer', customerId, parsed);
  }

  @Roles('Administrators')
  @Put(':customerId')
  update(
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(customerId, dto);
  }

  @Roles('Administrators')
  @Delete(':customerId')
  remove(@Param('customerId') customerId: string) {
    return this.customersService.remove(customerId);
  }
}
