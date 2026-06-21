import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { AssignSellerDto } from './dto/assign-seller.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

// ─── Customer ─────────────────────────────────────────────────────────────────

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // @Public + OptionalJwtGuard: route skips global guard,
  // then OptionalJwtGuard parses the bearer token if present.
  @Public()
  @UseGuards(OptionalJwtGuard)
  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.ordersService.create(dto, user?.id);
  }

  @Get('my')
  findMy(@CurrentUser() user: { id: string }) {
    return this.ordersService.findMyOrders(user.id);
  }

  // :id/track — declared after 'my' to avoid Fastify ambiguity (different segment count)
  @Public()
  @Get(':id/track')
  track(@Param('id') id: string) {
    return this.ordersService.track(id);
  }
}

// ─── Seller ───────────────────────────────────────────────────────────────────

@Roles('SELLER', 'WAREHOUSE')
@Controller('seller/orders')
export class SellerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string; role: string },
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findSellerOrders(user.id, { status, page, limit });
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.ordersService.updateStatus(id, dto.status, user.id, 'SELLER');
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: AdminOrdersQueryDto) {
    return this.ordersService.findAdminOrders(query);
  }

  @Patch(':id/assign')
  assignSeller(@Param('id') id: string, @Body() dto: AssignSellerDto) {
    return this.ordersService.assignSeller(id, dto.sellerId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.cancelOrder(id, dto.reason);
  }
}
