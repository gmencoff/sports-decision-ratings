import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  TradeSchema,
  SigningSchema,
  DraftSelectionSchema,
  ReleaseSchema,
  PlayerExtensionSchema,
  StaffExtensionSchema,
  HireSchema,
  FireSchema,
  PromotionSchema,
  type TransactionInput,
} from '@/lib/data/types';
import { NFL_TEAMS } from '@/lib/data/types';
import { type RssItem } from './feed-fetcher';

// Schemas without `id` (LLM does not produce IDs) and with timestamp as a string (LLM produces ISO strings)
const LlmTransactionSchema = z.union([
  TradeSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  SigningSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  DraftSelectionSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  ReleaseSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  PlayerExtensionSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  StaffExtensionSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  HireSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  FireSchema.omit({ id: true }).extend({ timestamp: z.string() }),
  PromotionSchema.omit({ id: true }).extend({ timestamp: z.string() }),
]);

const LlmTransactionArraySchema = z.array(LlmTransactionSchema);

const TEAM_MAP_TEXT = NFL_TEAMS.map((t) => `${t.id}: ${t.name}`).join('\n');

const TRANSACTION_INPUT_SCHEMA_DESCRIPTION = `
Each transaction must be one of these types (all include teamIds: string[], timestamp: ISO string):

trade: { type: "trade", teamIds, timestamp, assets: TradeAsset[] }
  TradeAsset is one of:
    { type: "player", fromTeamId, toTeamId, player: { name, position } }
    { type: "coach", fromTeamId, toTeamId, staff: { name, role } }
    { type: "draft_pick", fromTeamId, toTeamId, draftPick: { ogTeamId, year, round, number? } }
    { type: "conditional_draft_pick", fromTeamId, toTeamId, draftPick: { ogTeamId, year, round, number? }, conditions: string }
  position must be one of: QB, RB, FB, WR, TE, OT, OG, C, DE, DT, NT, LB, CB, S, K, P, LS
  role must be one of: President, General Manager, Head Coach, Offensive Coordinator, Defensive Coordinator,
    Special Teams Coordinator, Quarterbacks Coach, Running Backs Coach, Wide Receivers Coach, Tight Ends Coach,
    Offensive Line Coach, Offensive Quality Control Coach, Pass Game Coordinator, Run Game Coordinator,
    Offensive Assistant, Defensive Line Coach, Linebackers Coach, Defensive Backs Coach,
    Defensive Quality Control Coach, Defensive Assistant, Strength and Conditioning Coach, Assistant Coach

signing: { type: "signing", teamIds, timestamp, player: { name, position }, contract: { years?, totalValue?, guaranteed? } }

draft: { type: "draft", teamIds, timestamp, player: { name, position }, draftPick: { ogTeamId, year, round, number? } }

release: { type: "release", teamIds, timestamp, player: { name, position }, capSavings?: number }

extension (player): { type: "extension", subtype: "player", teamIds, timestamp, player: { name, position }, contract: { years?, totalValue?, guaranteed? } }

extension (staff): { type: "extension", subtype: "staff", teamIds, timestamp, staff: { name, role }, contract: { years?, totalValue? } }

hire: { type: "hire", teamIds, timestamp, staff: { name, role }, contract: { years?, totalValue? } }

fire: { type: "fire", teamIds, timestamp, staff: { name, role } }

promotion: { type: "promotion", teamIds, timestamp, staff: { name, role }, previousRole: role, contract: { years?, totalValue? } }

Money values are in dollars (e.g. 10000000 for $10M). teamIds contains all team abbreviations involved.
`;

export async function extractTransactions(
  item: RssItem,
  anthropic: Anthropic
): Promise<TransactionInput[]> {
  const prompt = `You are an NFL transaction parser. Extract only CONFIRMED transactions — not rumors, speculation, or unverified reports.

## NFL Team IDs
${TEAM_MAP_TEXT}

## Transaction Schema
${TRANSACTION_INPUT_SCHEMA_DESCRIPTION}

## Article
Title: ${item.title}
Published: ${item.pubDate.toISOString()}
Description: ${item.description}

## Instructions
- Return ONLY a valid JSON array of transaction objects
- Set timestamp to the article's published date: ${item.pubDate.toISOString()}
- Do NOT include an "id" field — it is generated server-side
- Return [] if the article contains no confirmed transactions, only rumors/speculation, or is not about NFL roster/staff moves
- Only include transactions you are highly confident about`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return [];

    const rawText = content.text.trim();

    // Extract JSON array from response (may be wrapped in markdown code blocks)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\[[\s\S]*\])/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse LLM response as JSON:', rawText.slice(0, 200));
      return [];
    }

    const validation = LlmTransactionArraySchema.safeParse(parsed);
    if (!validation.success) {
      console.error('LLM output failed Zod validation:', validation.error.issues.slice(0, 3));
      return [];
    }

    // Convert timestamp strings to Date objects
    return validation.data.map((t) => ({
      ...t,
      timestamp: new Date(t.timestamp),
    })) as TransactionInput[];
  } catch (err) {
    console.error('extractTransactions error:', err);
    return [];
  }
}
