import { ApiProperty } from '@nestjs/swagger';

export class ProductMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ProductResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } }) // Simplificado por ahora
  data: any[];

  @ApiProperty({ type: ProductMetaDto })
  meta: ProductMetaDto;
}
