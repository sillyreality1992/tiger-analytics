import type {
  ImportResult,
  PricingRecord,
  PricingSearchFilters,
  PricingUpdateFields,
} from './PricingTypes';

export type PricingRepository = {
  setupDatabase: () => Promise<boolean>;

  importCsv: (fileUri: string) => Promise<ImportResult>;

  searchRecords: (
    filters: PricingSearchFilters
  ) => Promise<PricingRecord[]>;

  updateRecord: (
    id: number,
    fields: PricingUpdateFields
  ) => Promise<{ updated: boolean }>;
};
