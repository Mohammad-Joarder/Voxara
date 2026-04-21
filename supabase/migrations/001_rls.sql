create type plan_tier as enum ('FREE', 'STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE');
create type platform as enum ('YOUTUBE', 'TIKTOK', 'INSTAGRAM');
create type content_type as enum ('VIDEO', 'REEL', 'SHORT', 'STORY', 'POST');
create type sentiment as enum ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'AMBIGUOUS');
create type intent_level as enum ('NONE', 'INTEREST', 'STRONG', 'POST_PURCHASE');
create type impact_level as enum ('HIGH', 'MEDIUM', 'LOW');
create type alert_type as enum ('SENTIMENT_SPIKE', 'QUOTA_EXHAUSTED', 'SYNC_FAILED', 'INSIGHT_READY', 'GENERAL');
create type alert_severity as enum ('INFO', 'WARNING', 'HIGH', 'CRITICAL');
create type sync_type as enum ('SCHEDULED', 'BACKFILL', 'MANUAL', 'WEBHOOK');
create type ingestion_status as enum ('RUNNING', 'SUCCESS', 'FAILED', 'QUOTA_EXCEEDED');

alter table creators enable row level security;
alter table connected_accounts enable row level security;
alter table content enable row level security;
alter table comments enable row level security;
alter table sentiment_results enable row level security;
alter table cta_extractions enable row level security;
alter table intent_signals enable row level security;
alter table insight_cards enable row level security;
alter table alerts enable row level security;
alter table ingestion_logs enable row level security;

create policy creators_select_own
  on creators
  for select
  using (auth.uid()::text = id);

create policy creators_update_own
  on creators
  for update
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create policy connected_accounts_all_own
  on connected_accounts
  for all
  using (creator_id = auth.uid()::text)
  with check (creator_id = auth.uid()::text);

create policy content_select_own
  on content
  for select
  using (creator_id = auth.uid()::text);

create policy comments_select_own
  on comments
  for select
  using (creator_id = auth.uid()::text);

create policy sentiment_results_select_own
  on sentiment_results
  for select
  using (creator_id = auth.uid()::text);

create policy cta_extractions_select_own
  on cta_extractions
  for select
  using (creator_id = auth.uid()::text);

create policy intent_signals_select_own
  on intent_signals
  for select
  using (creator_id = auth.uid()::text);

create policy insight_cards_select_own
  on insight_cards
  for select
  using (creator_id = auth.uid()::text);

create policy insight_cards_update_own
  on insight_cards
  for update
  using (creator_id = auth.uid()::text)
  with check (creator_id = auth.uid()::text);

create policy alerts_select_own
  on alerts
  for select
  using (creator_id = auth.uid()::text);

create policy alerts_update_own
  on alerts
  for update
  using (creator_id = auth.uid()::text)
  with check (creator_id = auth.uid()::text);

create policy ingestion_logs_select_own
  on ingestion_logs
  for select
  using (creator_id = auth.uid()::text);
