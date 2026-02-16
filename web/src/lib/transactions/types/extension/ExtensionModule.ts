import { Extension } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
import { ExtensionForm, DEFAULT_PLAYER_EXTENSION } from './ExtensionForm';
import { ExtensionCard } from './ExtensionCard';

export class ExtensionModule implements TransactionModule<Extension> {
  readonly type = 'extension' as const;
  readonly label = 'Extension';

  Form = ExtensionForm;
  Card = ExtensionCard;

  createDefault(): Extension {
    return { ...DEFAULT_PLAYER_EXTENSION };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_input: Extension): ValidationResult {
    return { valid: true, errors: [] };
  }
}
