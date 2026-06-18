import type { PricingRepository } from '../PricingRepository';
import type { PricingUpdateFields } from '../PricingTypes';

export function updatePricingRecord(repository: PricingRepository) {
  return async function execute(id: number, fields: PricingUpdateFields) {
    return repository.updateRecord(id, fields);
  };
}
