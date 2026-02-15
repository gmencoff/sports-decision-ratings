import { Extension } from '@/lib/data/types';
import { CardProps } from '../../interface';
import { PlayerExtensionCard } from './PlayerExtensionCard';
import { StaffExtensionCard } from './StaffExtensionCard';

export function ExtensionCard({ transaction }: CardProps<Extension>) {
  if (transaction.subtype === 'staff') {
    return <StaffExtensionCard transaction={transaction} />;
  }
  return <PlayerExtensionCard transaction={transaction} />;
}
