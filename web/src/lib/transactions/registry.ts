import { Transaction, TransactionType } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from './interface';
import { TradeModule } from './types/trade';
import { SigningModule } from './types/signing';
import { DraftModule } from './types/draft';
import { ReleaseModule } from './types/release';
import { ExtensionModule } from './types/extension';
import { HireModule } from './types/hire';
import { FireModule } from './types/fire';
import { PromotionModule } from './types/promotion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modules: Record<TransactionType, TransactionModule<any>> = {
  trade: new TradeModule(),
  signing: new SigningModule(),
  draft: new DraftModule(),
  release: new ReleaseModule(),
  extension: new ExtensionModule(),
  hire: new HireModule(),
  fire: new FireModule(),
  promotion: new PromotionModule(),
};

export function getModule<T extends Transaction>(type: T['type']): TransactionModule<T> {
  return modules[type];
}

export function getAllModules(): TransactionModule<Transaction>[] {
  return Object.values(modules);
}

export function validateTransaction(input: Transaction): ValidationResult {
  const cmodule = modules[input.type];
  return cmodule.validate(input);
}
