import { Hire } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { HireForm } from './HireForm';
import { HireCard } from './HireCard';

export class HireModule implements TransactionModule<Hire> {
  readonly type = 'hire' as const;
  readonly label = 'Hire';

  Form = HireForm;
  Card = HireCard;

  createDefault(): Hire {
    return {
      id: '',
      type: 'hire',
      teams: [],
      timestamp: new Date(),
      staff: { name: '', role: 'Head Coach' },
    };
  }
}
