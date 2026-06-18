import PriceFeedNativeModule, {
  addImportProgressListener,
  type PricingRecord,
  type PricingSearchFilters,
  type PricingUpdateFields,
  type ImportResult,
  type ImportProgressEvent,
} from './PriceFeedNativeModule';

export type {
  PricingRecord,
  PricingSearchFilters,
  PricingUpdateFields,
  ImportResult,
  ImportProgressEvent,
};

export { addImportProgressListener };

export function setupDatabase(): Promise<boolean> {
  return PriceFeedNativeModule.setupDatabase();
}

export function importCsv(fileUri: string): Promise<ImportResult> {
  return PriceFeedNativeModule.importCsv(fileUri);
}

export function searchRecords(
  filters: PricingSearchFilters
): Promise<PricingRecord[]> {
  return PriceFeedNativeModule.searchRecords(filters);
}

export function updateRecord(
  id: number,
  fields: PricingUpdateFields
): Promise<{ updated: boolean }> {
  return PriceFeedNativeModule.updateRecord(id, fields);
}