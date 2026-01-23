import { Trade } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { TradeForm } from './TradeForm';

export class TradeModule implements TransactionModule<Trade> {
  readonly type = 'trade' as const;
  readonly label = 'Trade';

  Form = TradeForm;

  createDefault(): Trade {
    return {
      id: '',
      type: 'trade',
      title: '',
      description: '',
      teams: [],
      timestamp: new Date(),
      assets: [],
    };
  }
}
