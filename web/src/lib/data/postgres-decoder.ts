import { TransactionSchema } from './types';
import { Transaction } from './types';

interface DbRow {
  id: string;
  type: string;
  teamIds: string[];
  timestamp: Date;
  data: unknown;
}

export function decodeTransaction(dbTxn: DbRow): Transaction {
  return TransactionSchema.parse({
    id: dbTxn.id,
    teamIds: dbTxn.teamIds,
    timestamp: dbTxn.timestamp,
    type: dbTxn.type,
    ...(dbTxn.data as object),
  });
}
