import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import { ClickService } from './click.service';
import { PaymeService } from './payme.service';

// ─── Payment gateway webhooks (no JWT — providers use their own auth) ──────────

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymeService: PaymeService,
    private readonly clickService: ClickService,
  ) {}

  // Payme JSON-RPC 2.0 — single endpoint for all Payme methods
  @Public()
  @Post('payme')
  payme(
    @Body() body: any,
    @Headers('authorization') authorization: string,
  ) {
    return this.paymeService.handle(body, authorization);
  }

  // Click Merchant API — two-step (prepare then complete)
  @Public()
  @Post('click/prepare')
  clickPrepare(@Body() body: any) {
    return this.clickService.prepare(body);
  }

  @Public()
  @Post('click/complete')
  clickComplete(@Body() body: any) {
    return this.clickService.complete(body);
  }

  // ─── Internal helpers (admin only) ─────────────────────────────────────────

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post(':orderId/url/payme')
  getPaymeUrl(
    @Param('orderId') orderId: string,
    @Body('amount') amount: number,
  ) {
    return { data: { url: this.paymeService.getPaymentUrl(orderId, amount) } };
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post(':orderId/url/click')
  getClickUrl(
    @Param('orderId') orderId: string,
    @Body('amount') amount: number,
  ) {
    return { data: { url: this.clickService.getPaymentUrl(orderId, amount) } };
  }
}
