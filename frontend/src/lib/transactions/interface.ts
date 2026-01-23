import { Transaction } from '@/lib/data/types';

export interface FormProps<T extends Transaction> {
  value?: T;
  onSubmit: (transaction: T) => void;
}

export interface TransactionModule<T extends Transaction> {
  readonly type: T['type'];
  readonly label: string;

  Form: React.FC<FormProps<T>>;
  createDefault(): T;
}
