import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryMovementReason } from '@prisma/client';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  variantId: number;

  @Type(() => Number)
  @IsInt()
  delta: number;

  @IsString()
  @IsIn(Object.values(InventoryMovementReason))
  reason: InventoryMovementReason;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  referenceId?: number;
}
