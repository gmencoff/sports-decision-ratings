import { Extension } from '@/lib/data/types';
import { TransactionModule } from '../../interface';
import { ExtensionForm } from './ExtensionForm';

export class ExtensionModule implements TransactionModule<Extension> {
  readonly type = 'extension' as const;
  readonly label = 'Extension';

  Form = ExtensionForm;

  createDefault(): Extension {
    return {
      id: '',
      type: 'extension',
      title: '',
      description: '',
      teams: [],
      timestamp: new Date(),
      player: { name: '', position: '' },
      contractYears: 1,
      totalValue: 0,
      guaranteed: 0,
    };
  }
}
