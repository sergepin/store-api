import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsInt, IsNumber, ValidateNested, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../../common/enums/commerce.enums';

class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  basePriceMinor: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  compareAtPriceMinor?: number;

  @IsInt()
  @Min(0)
  initialStock: number;

  @IsOptional()
  attributes?: any;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @IsInt()
  @IsOptional()
  primaryCategoryId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  categoryIds?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsInt()
  @IsOptional()
  primaryCategoryId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  categoryIds?: number[];
}
