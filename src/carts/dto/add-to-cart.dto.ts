import { IsInt, IsPositive } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  variantId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
