import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminUpdateSellerDto } from './dto/admin-update-seller.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { ResetSellerPasswordDto } from './dto/reset-seller-password.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { SellersService } from './sellers.service';

// ─── Customer: become a seller ────────────────────────────────────────────────

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('register')
  register(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterSellerDto,
  ) {
    return this.sellersService.register(user.id, dto);
  }
}

// ─── Seller: own profile and stats ───────────────────────────────────────────

@Roles('SELLER', 'WAREHOUSE')
@Controller('seller')
export class SellerProfileController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.sellersService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.sellersService.updateProfile(user.id, dto);
  }

  @Get('stats')
  getStats(@CurrentUser() user: { id: string }) {
    return this.sellersService.getStats(user.id);
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.sellersService.getLeaderboard();
  }
}

// ─── Admin: manage sellers ────────────────────────────────────────────────────

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/sellers')
export class AdminSellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  listSellers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.sellersService.adminListSellers(page, limit);
  }

  @Patch(':id')
  updateSeller(
    @Param('id') id: string,
    @Body() dto: AdminUpdateSellerDto,
  ) {
    return this.sellersService.adminUpdateSeller(id, dto);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetSellerPasswordDto,
  ) {
    return this.sellersService.adminResetPassword(id, dto);
  }
}
