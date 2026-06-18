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

export type ImportProgressEvent = {
  imported: number;
  failed: number;
};

export type PriceFeedNativeModuleEvents = {
  onImportProgress: (event: ImportProgressEvent) => void;
};
