import { Fire } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
import { FireForm } from './FireForm';
import { FireCard } from './FireCard';

export class FireModule implements TransactionModule<Fire> {
  readonly type = 'fire' as const;
  readonly label = 'Fire';

  Form = FireForm;
  Card = FireCard;

  createDefault(): Fire {
    return {
      id: '',
      type: 'fire',
      teams: [],
      timestamp: new Date(),
      staff: { name: '', role: 'Head Coach' },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Fire): ValidationResult {
    return { valid: true, errors: [] };
  }
}
