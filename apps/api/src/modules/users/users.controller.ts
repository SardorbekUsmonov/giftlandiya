import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateGiftCalendarDto } from './dto/create-gift-calendar.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateGiftCalendarDto } from './dto/update-gift-calendar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  @Get('profile')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // ─── Addresses ────────────────────────────────────────────────────────────

  @Get('addresses')
  getAddresses(@CurrentUser() user: { id: string }) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('addresses')
  addAddress(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.addAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.id, id);
  }

  // Must be declared before :id to avoid Fastify catching 'default' as an id
  @Post('addresses/:id/default')
  setDefaultAddress(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.usersService.setDefaultAddress(user.id, id);
  }

  // ─── Coins ────────────────────────────────────────────────────────────────

  @Get('coins')
  getCoins(@CurrentUser() user: { id: string }) {
    return this.usersService.getCoins(user.id);
  }

  // ─── Orders alias ─────────────────────────────────────────────────────────

  @Get('orders')
  getOrders(@CurrentUser() user: { id: string }) {
    return this.usersService.getOrders(user.id);
  }

  // ─── Referral ─────────────────────────────────────────────────────────────

  @Get('referral')
  getReferral(@CurrentUser() user: { id: string }) {
    return this.usersService.getReferral(user.id);
  }

  // ─── Gift Calendar ────────────────────────────────────────────────────────

  @Get('gift-calendar')
  getGiftCalendar(@CurrentUser() user: { id: string }) {
    return this.usersService.getGiftCalendar(user.id);
  }

  @Post('gift-calendar')
  addGiftCalendarEvent(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateGiftCalendarDto,
  ) {
    return this.usersService.addGiftCalendarEvent(user.id, dto);
  }

  @Patch('gift-calendar/:id')
  updateGiftCalendarEvent(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateGiftCalendarDto,
  ) {
    return this.usersService.updateGiftCalendarEvent(user.id, id, dto);
  }

  @Delete('gift-calendar/:id')
  deleteGiftCalendarEvent(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.usersService.deleteGiftCalendarEvent(user.id, id);
  }
}
