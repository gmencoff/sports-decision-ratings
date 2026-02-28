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
      teamIds: ['ARI'],
      timestamp: new Date(),
      player: { name: '', position: 'QB' },
      draftPick: { ogTeamId: 'ARI', year: new Date().getFullYear(), round: 1, number: 1 },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: DraftSelection): ValidationResult {
    return { valid: true, errors: [] };
  }
}
