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
import { TenantsService } from '../tenants/tenants.service';
import { InventoryMovementReason } from '@prisma/client';

// TODO: Use real tenant resolution
const DEV_TENANT_SLUG = 'gamer-store';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('adjust')
  async adjustStock(@Body() dto: AdjustStockDto) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);

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
  async getAvailability(@Param('variantId', ParseIntPipe) variantId: number) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.inventoryService.getAvailability(tenantId, variantId);
  }
}
