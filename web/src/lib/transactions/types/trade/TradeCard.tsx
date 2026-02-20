import { Trade, NFL_TEAMS } from '@/lib/data/types';
import { CardProps } from '../../interface';

export function TradeCard({ transaction }: CardProps<Trade>) {
  const getTeamAbbreviation = (teamId: string): string => {
    const team = NFL_TEAMS.find((t) => t.id === teamId);
    return team?.abbreviation || teamId;
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        {transaction.assets.length} asset{transaction.assets.length !== 1 ? 's' : ''} exchanged
      </div>
      <ul className="text-sm space-y-1">
        {transaction.assets.map((asset, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-gray-400">{asset.fromTeamId} → {asset.toTeamId}:</span>
            {asset.type === 'player' && (
              <span>{asset.player.name} ({asset.player.position})</span>
            )}
            {asset.type === 'coach' && (
              <span>{asset.staff.name} ({asset.staff.role})</span>
            )}
            {asset.type === 'draft_pick' && (
              <span>
                {asset.draftPick.year} Round {asset.draftPick.round}
                {asset.draftPick.number != null && `, Pick ${asset.draftPick.number}`}
                {' '}({getTeamAbbreviation(asset.draftPick.ogTeamId)})
              </span>
            )}
            {asset.type === 'conditional_draft_pick' && (
              <span>
                {asset.draftPick.year} Round {asset.draftPick.round}
                {asset.draftPick.number != null && `, Pick ${asset.draftPick.number}`}
                {' '}({getTeamAbbreviation(asset.draftPick.ogTeamId)}) (conditional)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
