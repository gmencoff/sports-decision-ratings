import { DraftSelection } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { DraftForm } from './DraftForm';
import { DraftCard } from './DraftCard';

export class DraftModule implements TransactionModule<DraftSelection> {
  readonly type = 'draft' as const;
  readonly label = 'Draft Selection';

  Form = DraftForm;
  Card = DraftCard;

  createDefault(): DraftSelection {
    return {
      id: '',
      type: 'draft',
      teams: [],
      timestamp: new Date(),
      player: { name: '', position: '' },
      round: 1,
      pick: 1,
    };
  }
}
