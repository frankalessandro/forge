-- Add primary and secondary muscle name arrays to exercises
alter table exercises
  add column if not exists primary_muscles text[] default '{}',
  add column if not exists secondary_muscles text[] default '{}';
