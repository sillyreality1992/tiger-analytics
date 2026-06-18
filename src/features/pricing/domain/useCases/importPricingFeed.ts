import type { PricingRepository } from '../PricingRepository';

export function importPricingFeed(repository: PricingRepository) {
  return async function execute(fileUri: string) {
    return repository.importCsv(fileUri);
  };
}
