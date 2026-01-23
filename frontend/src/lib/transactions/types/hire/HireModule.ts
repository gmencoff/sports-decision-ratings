import { Hire } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { HireForm } from './HireForm';

export class HireModule implements TransactionModule<Hire> {
  readonly type = 'hire' as const;
  readonly label = 'Hire';

  Form = HireForm;

  createDefault(): Hire {
    return {
      id: '',
      type: 'hire',
      title: '',
      description: '',
      teams: [],
      timestamp: new Date(),
      staff: { name: '', role: '' },
    };
  }
}
