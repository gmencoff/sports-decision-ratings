import { z } from 'zod';

export type Conference = 'AFC' | 'NFC';
export type Division = 'North' | 'South' | 'East' | 'West';

export const NFL_TEAM_IDS = [
  'BUF', 'MIA', 'NE', 'NYJ',
  'BAL', 'CIN', 'CLE', 'PIT',
  'HOU', 'IND', 'JAX', 'TEN',
  'DEN', 'KC', 'LV', 'LAC',
  'DAL', 'NYG', 'PHI', 'WAS',
  'CHI', 'DET', 'GB', 'MIN',
  'ATL', 'CAR', 'NO', 'TB',
  'ARI', 'LAR', 'SF', 'SEA',
] as const;

export const TeamIdSchema = z.enum(NFL_TEAM_IDS);
export type TeamId = z.infer<typeof TeamIdSchema>;

export interface Team {
  id: TeamId;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: Division;
}

export const NFL_TEAMS: Team[] = [
  // AFC East
  { id: 'BUF', name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
  { id: 'MIA', name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
  { id: 'NE', name: 'New England Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East' },
  { id: 'NYJ', name: 'New York Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East' },
  // AFC North
  { id: 'BAL', name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
  { id: 'CIN', name: 'Cincinnati Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North' },
  { id: 'CLE', name: 'Cleveland Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North' },
  { id: 'PIT', name: 'Pittsburgh Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North' },
  // AFC South
  { id: 'HOU', name: 'Houston Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South' },
  { id: 'IND', name: 'Indianapolis Colts', abbreviation: 'IND', conference: 'AFC', division: 'South' },
  { id: 'JAX', name: 'Jacksonville Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South' },
  { id: 'TEN', name: 'Tennessee Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South' },
  // AFC West
  { id: 'DEN', name: 'Denver Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West' },
  { id: 'KC', name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' },
  { id: 'LV', name: 'Las Vegas Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West' },
  { id: 'LAC', name: 'Los Angeles Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West' },
  // NFC East
  { id: 'DAL', name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
  { id: 'NYG', name: 'New York Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East' },
  { id: 'PHI', name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
  { id: 'WAS', name: 'Washington Commanders', abbreviation: 'WAS', conference: 'NFC', division: 'East' },
  // NFC North
  { id: 'CHI', name: 'Chicago Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North' },
  { id: 'DET', name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North' },
  { id: 'GB', name: 'Green Bay Packers', abbreviation: 'GB', conference: 'NFC', division: 'North' },
  { id: 'MIN', name: 'Minnesota Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North' },
  // NFC South
  { id: 'ATL', name: 'Atlanta Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South' },
  { id: 'CAR', name: 'Carolina Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South' },
  { id: 'NO', name: 'New Orleans Saints', abbreviation: 'NO', conference: 'NFC', division: 'South' },
  { id: 'TB', name: 'Tampa Bay Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South' },
  // NFC West
  { id: 'ARI', name: 'Arizona Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West' },
  { id: 'LAR', name: 'Los Angeles Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West' },
  { id: 'SF', name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West' },
  { id: 'SEA', name: 'Seattle Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West' },
];

// Lookup map for O(1) team retrieval by ID
const TEAM_MAP = new Map<TeamId, Team>(NFL_TEAMS.map((t) => [t.id, t]));

export function getTeamById(id: string): Team | undefined {
  return TEAM_MAP.get(id as TeamId);
}

export const POSITIONS = [
  'QB',
  'RB',
  'FB',
  'WR',
  'TE',
  'OT',
  'OG',
  'C',
  'DE',
  'DT',
  'NT',
  'LB',
  'CB',
  'S',
  'K',
  'P',
  'LS',
] as const;

export const PositionSchema = z.enum(POSITIONS);
export type Position = z.infer<typeof PositionSchema>;

export const PlayerSchema = z.object({
  name: z.string(),
  position: PositionSchema,
});
export type Player = z.infer<typeof PlayerSchema>;

export const PlayerContractSchema = z.object({
  years: z.number().optional(),
  totalValue: z.number().optional(),
  guaranteed: z.number().optional(),
});
export type PlayerContract = z.infer<typeof PlayerContractSchema>;

export function createPlayerContract(
  years?: number,
  totalValue?: number,
  guaranteed?: number
): PlayerContract {
  return { years, totalValue, guaranteed };
}

export const StaffContractSchema = z.object({
  years: z.number().optional(),
  totalValue: z.number().optional(),
});
export type StaffContract = z.infer<typeof StaffContractSchema>;

export function createStaffContract(
  years?: number,
  totalValue?: number
): StaffContract {
  return { years, totalValue };
}

export const ROLES = [
  'President',
  'General Manager',
  'Head Coach',
  'Offensive Coordinator',
  'Defensive Coordinator',
  'Special Teams Coordinator',
  'Quarterbacks Coach',
  'Running Backs Coach',
  'Wide Receivers Coach',
  'Tight Ends Coach',
  'Offensive Line Coach',
  'Offensive Quality Control Coach',
  'Pass Game Coordinator',
  'Run Game Coordinator',
  'Offensive Assistant',
  'Defensive Line Coach',
  'Linebackers Coach',
  'Defensive Backs Coach',
  'Defensive Quality Control Coach',
  'Defensive Assistant',
  'Strength and Conditioning Coach',
  'Assistant Coach',
] as const;

export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const StaffSchema = z.object({
  name: z.string(),
  role: RoleSchema,
});
export type Staff = z.infer<typeof StaffSchema>;
