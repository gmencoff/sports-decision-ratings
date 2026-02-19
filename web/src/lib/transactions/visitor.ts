import {
  Transaction,
  TransactionType,
  Trade,
  Signing,
  DraftSelection,
  Release,
  Extension,
  Hire,
  Fire,
  Promotion,
  TRANSACTION_TYPES,
} from '@/lib/data/types';

// The visitor interface - methods receive optional transaction
// This allows visitors to either:
// 1. Create new transactions (ignore the input)
// 2. Process existing transactions (use the input)
export interface TransactionVisitor<R> {
  visitTrade(tx?: Trade): R;
  visitSigning(tx?: Signing): R;
  visitDraft(tx?: DraftSelection): R;
  visitRelease(tx?: Release): R;
  visitExtension(tx?: Extension): R;
  visitHire(tx?: Hire): R;
  visitFire(tx?: Fire): R;
  visitPromotion(tx?: Promotion): R;
}

// Dispatch by transaction object - passes the transaction to the visitor
export function visitTransaction<R>(tx: Transaction, visitor: TransactionVisitor<R>): R {
  switch (tx.type) {
    case 'trade':
      return visitor.visitTrade(tx);
    case 'signing':
      return visitor.visitSigning(tx);
    case 'draft':
      return visitor.visitDraft(tx);
    case 'release':
      return visitor.visitRelease(tx);
    case 'extension':
      return visitor.visitExtension(tx);
    case 'hire':
      return visitor.visitHire(tx);
    case 'fire':
      return visitor.visitFire(tx);
    case 'promotion':
      return visitor.visitPromotion(tx);
  }
}

// Dispatch by type string - calls the visitor without a transaction
export function visitByType<R>(type: TransactionType, visitor: TransactionVisitor<R>): R {
  switch (type) {
    case 'trade':
      return visitor.visitTrade();
    case 'signing':
      return visitor.visitSigning();
    case 'draft':
      return visitor.visitDraft();
    case 'release':
      return visitor.visitRelease();
    case 'extension':
      return visitor.visitExtension();
    case 'hire':
      return visitor.visitHire();
    case 'fire':
      return visitor.visitFire();
    case 'promotion':
      return visitor.visitPromotion();
  }
}

// Helper to get all transaction types for iteration
export function allTransactionTypes(): TransactionType[] {
  return [...TRANSACTION_TYPES];
}
