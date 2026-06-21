import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }
}
