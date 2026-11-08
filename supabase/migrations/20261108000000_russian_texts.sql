-- Russian texts for everything the database shows to users:
-- status labels, action labels and error messages of functions and triggers.
-- Function bodies are unchanged except for the messages; create or replace keeps the grants.

update public.statuses set label = 'Новая' where value = 'new';
update public.statuses set label = 'В работе' where value = 'in_progress';
update public.statuses set label = 'На проверке' where value = 'review';
update public.statuses set label = 'Принята' where value = 'accepted';
update public.statuses set label = 'На доработке' where value = 'rework';

update public.status_transitions set action_label = 'Взять в работу' where from_status = 'new' and to_status = 'in_progress';
update public.status_transitions set action_label = 'Отправить на проверку' where from_status = 'in_progress' and to_status = 'review';
update public.status_transitions set action_label = 'Принять' where from_status = 'review' and to_status = 'accepted';
update public.status_transitions set action_label = 'Вернуть на доработку' where from_status = 'review' and to_status = 'rework';
update public.status_transitions set action_label = 'Возобновить работу' where from_status = 'rework' and to_status = 'in_progress';

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
  v_from_label text;
  v_to_label text;
begin
  select * into v_task from public.tasks where id = p_task_id for update;

  if not found or v_task.deleted_at is not null then
    raise exception 'Задача не найдена';
  end if;

  -- An executor must not learn anything about other executors' tasks,
  -- so a foreign task looks exactly like a missing one (same as RLS)
  if v_role = 'executor' and v_task.executor_id is distinct from auth.uid() then
    raise exception 'Задача не найдена';
  end if;

  -- Creators can read every task, so the real reason is safe to show
  if v_role = 'creator' and v_task.author_id is distinct from auth.uid() then
    raise exception 'Менять статус может только автор задачи';
  end if;

  -- No profile, no role: nothing is allowed
  if v_role is null then
    raise exception 'Задача не найдена';
  end if;

  select * into v_rule
  from public.status_transitions
  where from_status = v_task.status and to_status = p_to_status;

  if not found then
    select label into v_from_label from public.statuses where value = v_task.status;
    select label into v_to_label from public.statuses where value = p_to_status;

    raise exception 'Переход из статуса «%» в «%» запрещён', coalesce(v_from_label, v_task.status), coalesce(v_to_label, p_to_status);
  end if;

  if v_rule.role is distinct from v_role then
    raise exception 'Это действие недоступно для вашей роли';
  end if;

  if v_rule.requires_comment and coalesce(trim(p_comment), '') = '' then
    raise exception 'Для этого действия нужен комментарий';
  end if;

  update public.tasks set status = p_to_status where id = p_task_id;

  insert into public.task_history (task_id, from_status, to_status, editor_id, comment)
  values (p_task_id, v_task.status, p_to_status, auth.uid(), nullif(trim(p_comment), ''));
end;
$$;

create or replace function public.delete_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
begin
  select * into v_task from public.tasks where id = p_task_id for update;

  if not found or v_task.deleted_at is not null then
    raise exception 'Задача не найдена';
  end if;

  if public.get_my_role() is distinct from 'creator' or v_task.author_id is distinct from auth.uid() then
    raise exception 'Удалить задачу может только её автор';
  end if;

  update public.tasks set deleted_at = now() where id = p_task_id;
end;
$$;

create or replace function public.constructions_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Soft-deleted tasks count too: their history must stay linked
  if exists (select 1 from public.tasks where construction_id = old.id) then
    raise exception 'Нельзя удалить объект, в котором есть задачи';
  end if;

  return old;
end;
$$;

create or replace function public.tasks_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_id := coalesce(auth.uid(), new.author_id);
  new.status := 'new';
  new.created_at := now();
  new.deleted_at := null;

  if not exists (
    select 1 from public.profiles
    where id = new.executor_id and role = 'executor'
  ) then
    raise exception 'Исполнителем можно назначить только пользователя с ролью исполнителя';
  end if;

  return new;
end;
$$;

create or replace function public.tasks_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'accepted'
     and (new.title is distinct from old.title or new.description is distinct from old.description) then
    raise exception 'Принятую задачу нельзя изменить';
  end if;

  return new;
end;
$$;
