-- Reference data the app cannot work without: task statuses and allowed status transitions.
-- Dumped from the project with pg_dump; column lists added so the inserts do not depend on column order.

insert into public.statuses (id, value, label) overriding system value values
  (1, 'new', 'New'),
  (2, 'in_progress', 'In progress'),
  (3, 'review', 'Review'),
  (4, 'accepted', 'Accepted'),
  (5, 'rework', 'Rework');

-- Keep the identity in sync with the explicit ids above
select pg_catalog.setval('public.statuses_id_seq', 5, true);

insert into public.status_transitions (from_status, to_status, role, requires_comment, action_label) values
  ('new', 'in_progress', 'executor', false, 'Start work'),
  ('in_progress', 'review', 'executor', false, 'Send to review'),
  ('review', 'accepted', 'creator', false, 'Accept'),
  ('review', 'rework', 'creator', true, 'Return for rework'),
  ('rework', 'in_progress', 'executor', false, 'Resume work');
