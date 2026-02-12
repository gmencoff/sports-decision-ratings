import { Signing } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
import { SigningForm } from './SigningForm';
import { SigningCard } from './SigningCard';

export class SigningModule implements TransactionModule<Signing> {
  readonly type = 'signing' as const;
  readonly label = 'Signing';

  Form = SigningForm;
  Card = SigningCard;

  createDefault(): Signing {
    return {
      id: '',
      type: 'signing',
      teams: [],
      timestamp: new Date(),
      player: { name: '', position: 'QB' },
      contractYears: 1,
      totalValue: 0,
      guaranteed: 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Signing): ValidationResult {
    return { valid: true, errors: [] };
  }
}
