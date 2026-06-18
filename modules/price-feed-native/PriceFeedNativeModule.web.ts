import { NativeModule, registerWebModule } from 'expo';

import type {
  ImportResult,
  PriceFeedNativeModuleEvents,
  PricingRecord,
  PricingSearchFilters,
  PricingUpdateFields,
} from './PriceFeedNative.types';

class PriceFeedNativeModule extends NativeModule<PriceFeedNativeModuleEvents> {
  async setupDatabase(): Promise<boolean> {
    return true;
  }

  async importCsv(_fileUri: string): Promise<ImportResult> {
    throw new Error('PriceFeedNative is not supported on web');
  }

  async searchRecords(
    _filters: PricingSearchFilters
  ): Promise<PricingRecord[]> {
    return [];
  }

  async updateRecord(
    _id: number,
    _fields: PricingUpdateFields
  ): Promise<{ updated: boolean }> {
    return { updated: false };
  }
}

export default registerWebModule(PriceFeedNativeModule, 'PriceFeedNative');
