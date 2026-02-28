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
      teamIds: [],
      timestamp: new Date(),
      player: { name: '', position: 'QB' },
      contract: {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Signing): ValidationResult {
    return { valid: true, errors: [] };
  }
}
