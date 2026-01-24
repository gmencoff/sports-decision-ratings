import { Signing } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
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
      player: { name: '', position: '' },
      contractYears: 1,
      totalValue: 0,
      guaranteed: 0,
    };
  }
}
