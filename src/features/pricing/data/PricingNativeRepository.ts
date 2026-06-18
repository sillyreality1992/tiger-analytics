import type { PricingRepository } from '../domain/PricingRepository';
import type {
  PricingSearchFilters,
  PricingUpdateFields,
} from '../domain/PricingTypes';

import * as PriceFeedNative from '../../../../modules/price-feed-native';

export const pricingNativeRepository: PricingRepository = {
  setupDatabase() {
    return PriceFeedNative.setupDatabase();
  },

  importCsv(fileUri: string) {
    return PriceFeedNative.importCsv(fileUri);
  },

  searchRecords(filters: PricingSearchFilters) {
    return PriceFeedNative.searchRecords(filters);
  },

  updateRecord(id: number, fields: PricingUpdateFields) {
    return PriceFeedNative.updateRecord(id, fields);
  },
};
