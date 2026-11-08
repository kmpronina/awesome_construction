-- Test data: profiles, constructions and tasks in every status, with real history.
--
-- Before running, create the users in Authentication → Users (with "Auto Confirm User"):
--   creator@gmail.com, creator2@gmail.com, executor1@gmail.com, executor2@gmail.com
-- Then run this file once in the SQL Editor. A second run is skipped, so data is not duplicated.
--
-- Status changes go through change_task_status, the same function the app uses, so every rule
-- is checked and history is written by the database. To act as a user, the script sets the JWT
-- claims that auth.uid() reads; the setting is local to this transaction.

do $$
declare
  v_creator uuid;
  v_creator2 uuid;
  v_executor1 uuid;
  v_executor2 uuid;

  v_riverside uuid;
  v_northgate uuid;
  v_school uuid;

  v_task uuid;
begin
  if exists (select 1 from public.constructions) then
    raise notice 'Seed skipped: constructions already exist';
    return;
  end if;

  select id into v_creator from auth.users where email = 'creator@gmail.com';
  select id into v_creator2 from auth.users where email = 'creator2@gmail.com';
  select id into v_executor1 from auth.users where email = 'executor1@gmail.com';
  select id into v_executor2 from auth.users where email = 'executor2@gmail.com';

  if v_creator is null or v_creator2 is null or v_executor1 is null or v_executor2 is null then
    raise exception 'Create all four users in Authentication → Users before running the seed';
  end if;

  -- Profiles: without a role a user sees nothing in the app
  insert into public.profiles (id, email, name, role) values
    (v_creator, 'creator@gmail.com', 'Постановщик 1', 'creator'),
    (v_creator2, 'creator2@gmail.com', 'Постановщик 2', 'creator'),
    (v_executor1, 'executor1@gmail.com', 'Исполнитель 1', 'executor'),
    (v_executor2, 'executor2@gmail.com', 'Исполнитель 2', 'executor')
  on conflict (id) do update set name = excluded.name, role = excluded.role;

  -- Act as Постановщик 1 (creator@gmail.com)
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);

  insert into public.constructions (title, address, author_id)
  values ('ЖК «Речной»', 'ул. Набережная, 12', v_creator)
  returning id into v_riverside;

  insert into public.constructions (title, address, author_id)
  values ('Бизнес-центр «Северный»', 'пр. Северный, 45', v_creator)
  returning id into v_northgate;

  -- New
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Проверить разметку фундамента', 'Сверить разметку осей с проектом и записать отклонения', v_riverside, v_executor1, v_creator);

  -- In progress
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Принять поставку арматуры', 'Проверить количество и сертификаты, подписать накладную', v_riverside, v_executor2, v_creator)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');

  -- Review
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);

  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Установить оконные рамы', 'Установить рамы на 1–3 этажах и загерметизировать швы', v_northgate, v_executor1, v_creator)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review', '1–3 этажи готовы, можно проверять');

  -- Accepted
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);

  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Залить стяжку пола', 'Залить стяжку в холле и проверить уровень', v_northgate, v_executor2, v_creator)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review');

  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'accepted', 'Уровень в пределах допуска');

  -- Act as Постановщик 2 (creator2@gmail.com): a second author shows that only the author can edit and accept
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator2, 'role', 'authenticated')::text, true);

  insert into public.constructions (title, address, author_id)
  values ('Школа в Зелёном парке', 'Парковый пер., 8', v_creator2)
  returning id into v_school;

  -- Rework
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Покрасить стены на лестницах', 'Загрунтовать и покрасить стены в обоих лестничных пролётах', v_school, v_executor1, v_creator2)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review');

  perform set_config('request.jwt.claims', json_build_object('sub', v_creator2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'rework', 'На втором этаже разводы, нужен ещё один слой');

  -- Back in progress after rework
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Подключить временное электричество', 'Подключить бытовку к временному электроснабжению', v_school, v_executor2, v_creator2)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review');

  perform set_config('request.jwt.claims', json_build_object('sub', v_creator2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'rework', 'Кабель не закреплён на стене');

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', 'Закрепляю кабель');

  -- Stop acting as a user
  perform set_config('request.jwt.claims', '', true);
end;
$$;
