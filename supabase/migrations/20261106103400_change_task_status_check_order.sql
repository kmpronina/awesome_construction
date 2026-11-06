-- Participation is checked before the transition, so an error never reveals
-- the status of a task the caller is not allowed to read.
create or replace function public.change_task_status(
  p_task_id uuid,
  p_to_status text,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
  v_rule public.status_transitions%rowtype;
  v_role text := public.get_my_role();
begin
  select * into v_task from public.tasks where id = p_task_id for update;

  if not found or v_task.deleted_at is not null then
    raise exception 'Task not found';
  end if;

  -- An executor must not learn anything about other executors' tasks,
  -- so a foreign task looks exactly like a missing one (same as RLS)
  if v_role = 'executor' and v_task.executor_id is distinct from auth.uid() then
    raise exception 'Task not found';
  end if;

  -- Creators can read every task, so the real reason is safe to show
  if v_role = 'creator' and v_task.author_id is distinct from auth.uid() then
    raise exception 'Only the task author can change the status';
  end if;

  -- No profile, no role: nothing is allowed
  if v_role is null then
    raise exception 'Task not found';
  end if;

  select * into v_rule
  from public.status_transitions
  where from_status = v_task.status and to_status = p_to_status;

  if not found then
    raise exception 'Transition % → % is prohibited', v_task.status, p_to_status;
  end if;

  if v_rule.role is distinct from v_role then
    raise exception 'This action is not available for your role';
  end if;

  if v_rule.requires_comment and coalesce(trim(p_comment), '') = '' then
    raise exception 'A comment is required';
  end if;

  update public.tasks set status = p_to_status where id = p_task_id;

  insert into public.task_history (task_id, from_status, to_status, editor_id, comment)
  values (p_task_id, v_task.status, p_to_status, auth.uid(), nullif(trim(p_comment), ''));
end;
$$;