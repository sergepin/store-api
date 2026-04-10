export enum CustomerType {
  GUEST = 'GUEST',
  INDIVIDUAL = 'INDIVIDUAL',
  B2B = 'B2B',
}

export enum ProductStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  VOIDED = 'VOIDED',
}

export enum PaymentProvider {
  MOCK = 'MOCK',
  WOMPI = 'WOMPI',
}

export enum InventoryReferenceType {
  ORDER = 'ORDER',
  ADJUSTMENT = 'ADJUSTMENT',
}
