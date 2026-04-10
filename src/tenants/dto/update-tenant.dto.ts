import { IsString, IsOptional, IsInt, IsJSON } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  orderNumberPrefix?: string;

  @IsInt()
  @IsOptional()
  orderNumberPadding?: number;

  @IsOptional()
  settings?: any;
}