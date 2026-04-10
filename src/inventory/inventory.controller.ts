import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  async adjustStock(@TenantId() tenantId: number, @Body() dto: AdjustStockDto) {
    const reference =
      dto.referenceType && dto.referenceId !== undefined
        ? { type: dto.referenceType, id: dto.referenceId }
        : undefined;

    return this.inventoryService.adjustOnHand(
      tenantId,
      dto.variantId,
      dto.delta,
      dto.reason,
      reference,
    );
  }

  @Get('availability/:variantId')
  async getAvailability(
    @TenantId() tenantId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.inventoryService.getAvailability(tenantId, variantId);
  }
}
