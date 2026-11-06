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
    (v_creator, 'creator@gmail.com', 'Creator 1', 'creator'),
    (v_creator2, 'creator2@gmail.com', 'Creator 2', 'creator'),
    (v_executor1, 'executor1@gmail.com', 'Executor 1', 'executor'),
    (v_executor2, 'executor2@gmail.com', 'Executor 2', 'executor')
  on conflict (id) do update set name = excluded.name, role = excluded.role;

  -- Act as Creator 1
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);

  insert into public.constructions (title, address, author_id)
  values ('Riverside Residential Complex', '12 River Street', v_creator)
  returning id into v_riverside;

  insert into public.constructions (title, address, author_id)
  values ('Northgate Office Center', '45 Northgate Avenue', v_creator)
  returning id into v_northgate;

  -- New
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Check foundation layout', 'Verify the axis layout against the project drawings and record any deviations', v_riverside, v_executor1, v_creator);

  -- In progress
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Accept rebar delivery', 'Check quantity and certificates, sign the delivery note', v_riverside, v_executor2, v_creator)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');

  -- Review
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);

  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Install window frames', 'Install frames on floors 1–3 and seal the joints', v_northgate, v_executor1, v_creator)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review', 'Floors 1–3 are done, ready for inspection');

  -- Accepted
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);

  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Lay floor screed', 'Pour the screed in the lobby and check the level', v_northgate, v_executor2, v_creator)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review');

  perform set_config('request.jwt.claims', json_build_object('sub', v_creator, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'accepted', 'Level is within tolerance');

  -- Act as Creator 2: a second author shows that only the author can edit and accept
  perform set_config('request.jwt.claims', json_build_object('sub', v_creator2, 'role', 'authenticated')::text, true);

  insert into public.constructions (title, address, author_id)
  values ('Green Park School', '8 Park Lane', v_creator2)
  returning id into v_school;

  -- Rework
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Paint stairwell walls', 'Prime and paint the walls of both stairwells', v_school, v_executor1, v_creator2)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review');

  perform set_config('request.jwt.claims', json_build_object('sub', v_creator2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'rework', 'Streaks on the second floor, apply one more coat');

  -- Back in progress after rework
  insert into public.tasks (title, description, construction_id, executor_id, author_id)
  values ('Connect temporary power', 'Connect the site cabin to the temporary power supply', v_school, v_executor2, v_creator2)
  returning id into v_task;

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress');
  perform public.change_task_status(v_task, 'review');

  perform set_config('request.jwt.claims', json_build_object('sub', v_creator2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'rework', 'The cable is not secured to the wall');

  perform set_config('request.jwt.claims', json_build_object('sub', v_executor2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', 'Securing the cable now');

  -- Stop acting as a user
  perform set_config('request.jwt.claims', '', true);
end;
$$;
