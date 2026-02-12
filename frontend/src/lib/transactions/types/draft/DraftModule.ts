import { DraftSelection } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
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
      player: { name: '', position: 'QB' },
      round: 1,
      pick: 1,
    };
  }

  validate(_input: DraftSelection): ValidationResult {
    return { valid: true, errors: [] };
  }
}
