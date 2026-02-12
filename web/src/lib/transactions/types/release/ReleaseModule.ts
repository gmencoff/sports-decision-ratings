import { Release } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Release): ValidationResult {
    return { valid: true, errors: [] };
  }
}
