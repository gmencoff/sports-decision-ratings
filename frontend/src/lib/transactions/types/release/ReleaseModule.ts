import { Release } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { ReleaseForm } from './ReleaseForm';

export class ReleaseModule implements TransactionModule<Release> {
  readonly type = 'release' as const;
  readonly label = 'Release';

  Form = ReleaseForm;

  createDefault(): Release {
    return {
      id: '',
      type: 'release',
      title: '',
      description: '',
      teams: [],
      timestamp: new Date(),
      player: { name: '', position: '' },
    };
  }
}
