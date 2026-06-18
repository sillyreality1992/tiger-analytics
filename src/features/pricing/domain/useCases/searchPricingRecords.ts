import type { PricingRepository } from '../PricingRepository';
import type { PricingSearchFilters } from '../PricingTypes';

export function searchPricingRecords(repository: PricingRepository) {
  return async function execute(filters: PricingSearchFilters) {
    return repository.searchRecords(filters);
  };
}
