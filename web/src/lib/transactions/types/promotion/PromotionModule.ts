import { Promotion } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
import { PromotionForm } from './PromotionForm';
import { PromotionCard } from './PromotionCard';

export class PromotionModule implements TransactionModule<Promotion> {
  readonly type = 'promotion' as const;
  readonly label = 'Promotion';

  Form = PromotionForm;
  Card = PromotionCard;

  createDefault(): Promotion {
    return {
      id: '',
      type: 'promotion',
      teams: [],
      timestamp: new Date(),
      staff: { name: '', role: 'Head Coach' },
      previousRole: 'Offensive Coordinator',
      contract: {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Promotion): ValidationResult {
    return { valid: true, errors: [] };
  }
}
