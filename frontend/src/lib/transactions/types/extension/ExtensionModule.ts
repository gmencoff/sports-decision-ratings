import { Extension } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { ExtensionForm } from './ExtensionForm';
import { ExtensionCard } from './ExtensionCard';

export class ExtensionModule implements TransactionModule<Extension> {
  readonly type = 'extension' as const;
  readonly label = 'Extension';

  Form = ExtensionForm;
  Card = ExtensionCard;

  createDefault(): Extension {
    return {
      id: '',
      type: 'extension',
      teams: [],
      timestamp: new Date(),
      player: { name: '', position: '' },
      contractYears: 1,
      totalValue: 0,
      guaranteed: 0,
    };
  }
}
