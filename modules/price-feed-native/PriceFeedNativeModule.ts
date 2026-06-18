import { NativeModule, requireNativeModule } from 'expo';
import type { EventSubscription } from 'expo-modules-core';

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

export type ImportProgressEvent = {
  imported: number;
  failed: number;
};

type PriceFeedNativeEvents = {
  onImportProgress: (event: ImportProgressEvent) => void;
};

declare class PriceFeedNativeModule extends NativeModule<PriceFeedNativeEvents> {
  setupDatabase(): Promise<boolean>;

  importCsv(fileUri: string): Promise<ImportResult>;

  searchRecords(filters: PricingSearchFilters): Promise<PricingRecord[]>;

  updateRecord(
    id: number,
    fields: PricingUpdateFields
  ): Promise<{ updated: boolean }>;
}

const nativeModule =
  requireNativeModule<PriceFeedNativeModule>('PriceFeedNative');

export default nativeModule;

export function addImportProgressListener(
  listener: (event: ImportProgressEvent) => void
): EventSubscription {
  return nativeModule.addListener('onImportProgress', listener);
}