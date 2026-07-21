import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AddPointsDto } from './dto/add-points.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  search(@Query('query') query?: string) {
    return this.customersService.search(query);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Post(':id/points')
  addPoints(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPointsDto,
  ) {
    return this.customersService.addPoints(id, dto);
  }
}
