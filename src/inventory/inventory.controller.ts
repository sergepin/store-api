import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/iam.enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @Roles(UserRole.ADMIN)
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
