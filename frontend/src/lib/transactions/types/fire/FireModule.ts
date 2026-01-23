import { Fire } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { FireForm } from './FireForm';

export class FireModule implements TransactionModule<Fire> {
  readonly type = 'fire' as const;
  readonly label = 'Fire';

  Form = FireForm;

  createDefault(): Fire {
    return {
      id: '',
      type: 'fire',
      title: '',
      description: '',
      teams: [],
      timestamp: new Date(),
      staff: { name: '', role: '' },
    };
  }
}
