import { Release } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { ReleaseForm } from './ReleaseForm';
import { ReleaseCard } from './ReleaseCard';

export class ReleaseModule implements TransactionModule<Release> {
  readonly type = 'release' as const;
  readonly label = 'Release';

  Form = ReleaseForm;
  Card = ReleaseCard;

  createDefault(): Release {
    return {
      id: '',
      type: 'release',
      teams: [],
      timestamp: new Date(),
      player: { name: '', position: 'QB' },
    };
  }
}
