import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsObject,
} from 'class-validator';

export class CheckoutOrderDto {
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsString()
  sessionKey?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsNotEmpty()
  @IsObject()
  shippingAddress: any;

  @IsOptional()
  @IsObject()
  billingAddress?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}
