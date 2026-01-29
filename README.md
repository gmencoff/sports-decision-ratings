# NFL Transactions Voting App

A public platform for discussing and evaluating NFL transactions.

The core idea is simple:

**Every NFL transaction can be voted on by fans as either Good or Bad.**

This creates a living, crowd-sourced record of how roster and personnel moves are perceived at the moment they happen — and how those perceptions age over time.

## Conceptual Overview

### What is a "transaction"?

A transaction is any official or reported action taken by an NFL team that affects personnel or roster construction.

Examples include:

- Trades
- Free-agent signings
- Draft picks
- Releases
- Contract extensions
- Coaching or executive hires and firings

Each transaction represents a single event in time and serves as the atomic unit of discussion and evaluation.

## Core User Experience

### 1. Transaction Feed

Users see a continuously updated feed of recent NFL transactions.

Each transaction in the feed:

- Clearly states what happened
- Shows which team(s) were involved
- Is timestamped
- Can be evaluated immediately

The feed is designed for fast scanning and quick reactions.

### 2. Voting

For every transaction, users can vote on every team involved in the transaction. Was the decision that the team made:

- **Good**
- **Bad**

Votes represent opinion, not correctness.

Voting should feel:

- Quick
- Lightweight
- Opinionated rather than analytical

The aggregate of votes forms the community sentiment for that transaction.

### 3. Community Sentiment

Each transaction displays:

- How many people voted
- How positive or negative the overall reaction is

This allows users to see:

- Consensus
- Controversy
- How opinions differ across transactions

Sentiment is not meant to declare truth — only perception.

### 4. Transaction Pages

Each transaction has a dedicated, shareable page.

This page acts as:

- A permanent reference for that transaction
- A snapshot of community reaction
- A point of entry from social platforms

Over time, transaction pages may also reflect how sentiment evolves.

## Mental Model

The app is built around a few simple ideas:

- **Transactions are facts**
- **Votes are opinions**
- **Aggregates represent collective perception**
- **Time matters**

A transaction does not become "good" or "bad" because the app says so — it becomes good or bad because people think it is.

## Scope Boundaries (Intentional)

This project is not initially focused on:

- Predicting outcomes
- Grading contracts by value
- Betting or gambling
- Advanced analytics
- Commentary or debates

The goal is to capture raw fan sentiment, not expert analysis.

## Future Conceptual Extensions (Not MVP)

While the MVP is transaction-focused, the same data could eventually support:

- Team pages showing how fans feel about a team's recent moves
- Long-term sentiment tracking for executives and decision-makers
- Comparisons between initial reaction and long-term outcomes
- Historical re-evaluation of famous transactions

These ideas emerge naturally from the transaction-centric model but are not required to validate the core concept.

## Guiding Principle

> If a fan sees a transaction headline, they should be able to express an opinion on it instantly.

The app succeeds if it becomes a reflexive second stop after breaking NFL news — a place to see how everyone feels about what just happened.
