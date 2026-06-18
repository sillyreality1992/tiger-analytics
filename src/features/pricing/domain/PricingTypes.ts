export type PricingRecord = {
  id: number;
  storeId: string;
  sku: string;
  productName: string;
  price: number;
  date: string;
};

export type PricingSearchFilters = {
  storeId?: string;
  sku?: string;
  productName?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};

export type PricingUpdateFields = {
  storeId?: string;
  sku?: string;
  productName?: string;
  price?: number;
  date?: string;
};

export type ImportResult = {
  imported: number;
  failed: number;
};
