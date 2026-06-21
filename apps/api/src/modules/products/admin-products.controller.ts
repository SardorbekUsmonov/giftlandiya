import { Body, Controller, Delete, Param, ParseArrayPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('bulk')
  bulkCreate(
    @Body(new ParseArrayPipe({ items: CreateProductDto }))
    dtos: CreateProductDto[],
  ) {
    return this.productsService.bulkCreate(dtos);
  }
}
