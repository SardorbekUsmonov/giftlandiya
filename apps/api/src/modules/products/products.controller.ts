import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/roles.decorator';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { ProductsService } from './products.service';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: FindAllProductsDto) {
    return this.productsService.findAll(query);
  }

  // Static routes declared before :slug to prevent Fastify treating them as slug params

  @Get('search')
  search(@Query('q') q: string) {
    return this.productsService.searchByQuery(q ?? '');
  }

  @Get('semantic-search')
  semanticSearch(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.semanticSearch(q ?? '', limit ? parseInt(limit, 10) : 12);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // 3-segment path — no conflict with :slug (2 segments)
  @Get(':id/bought-together')
  getBoughtTogether(@Param('id') id: string) {
    return this.productsService.getBoughtTogether(id);
  }
}
