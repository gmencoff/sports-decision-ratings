import { Extension } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
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
      player: { name: '', position: 'QB' },
      contract: {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Extension): ValidationResult {
    return { valid: true, errors: [] };
  }
}
