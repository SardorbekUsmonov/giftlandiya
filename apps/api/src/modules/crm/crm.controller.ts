import { Controller, Get, Param, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmService } from './crm.service';

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/customers')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.crmService.getCustomers(+page, +limit, search);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.crmService.getCustomerDetail(id);
  }

  @Get(':id/insight')
  getInsight(@Param('id') id: string) {
    return this.crmService.getCustomerInsight(id);
  }
}
