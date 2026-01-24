import { Trade } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { TradeForm } from './TradeForm';
import { TradeCard } from './TradeCard';

export class TradeModule implements TransactionModule<Trade> {
  readonly type = 'trade' as const;
  readonly label = 'Trade';

  Form = TradeForm;
  Card = TradeCard;

  createDefault(): Trade {
    return {
      id: '',
      type: 'trade',
      teams: [],
      timestamp: new Date(),
      assets: [],
    };
  }
}
