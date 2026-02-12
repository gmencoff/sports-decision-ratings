import { Trade } from '@/lib/data/types';
import { TransactionModule, ValidationResult } from '../../interface';
import { TradeForm } from './TradeForm';
import { TradeCard } from './TradeCard';

export class TradeModule implements TransactionModule<Trade> {
  readonly type = 'trade' as const;
  readonly label = 'Trade';

  Form = TradeForm;
  Card = TradeCard;

  createDefault(): Trade {
    return {
      id: '',
      type: 'trade',
      teams: [],
      timestamp: new Date(),
      assets: [],
    };
  }

  validate(input: Trade): ValidationResult {
    if (input.type !== 'trade') {
      return { valid: false, errors: ['Invalid transaction type for trade validation'] };
    }

    const errors: string[] = [];
    const trade = input as Omit<Trade, 'id'> | Trade;
    const teamIds = new Set(trade.teams.map((t) => t.id));

    // Collect all team IDs referenced in assets
    const assetTeamIds = new Set<string>();
    for (const asset of trade.assets) {
      assetTeamIds.add(asset.fromTeamId);
      assetTeamIds.add(asset.toTeamId);
    }

    // Check that all asset team IDs are in the teams array
    for (const assetTeamId of assetTeamIds) {
      if (!teamIds.has(assetTeamId)) {
        errors.push(`Team '${assetTeamId}' referenced in trade assets is not in the teams list`);
      }
    }

    // Check that all teams in the teams array are referenced in assets
    for (const teamId of teamIds) {
      if (!assetTeamIds.has(teamId)) {
        errors.push(`Team '${teamId}' is in the teams list but not referenced in any trade asset`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
