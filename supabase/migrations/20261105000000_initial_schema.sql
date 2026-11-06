-- Initial schema: tables, enum, functions, triggers, RLS policies and column privileges.
-- Dumped from the project with pg_dump (schema public only) and cleaned up:
-- removed CREATE SCHEMA public, Supabase-managed rls_auto_enable() and default privileges,
-- because a new Supabase project already has them.

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'creator',
    'executor'
);


--
-- Name: change_task_status(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.change_task_status(p_task_id uuid, p_to_status text, p_comment text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: constructions_before_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.constructions_before_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- Soft-deleted tasks count too: their history must stay linked
  if exists (select 1 from public.tasks where construction_id = old.id) then
    raise exception 'You cannot delete an object that contains tasks.';
  end if;

  return old;
end;
$$;


--
-- Name: constructions_before_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.constructions_before_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  new.author_id := coalesce(auth.uid(), new.author_id);
  return new;
end;
$$;


--
-- Name: delete_task(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_task(p_task_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_task public.tasks%rowtype;
begin
  select * into v_task from public.tasks where id = p_task_id for update;

  if not found or v_task.deleted_at is not null then
    raise exception 'Task not found';
  end if;

  if public.get_my_role() is distinct from 'creator' or v_task.author_id is distinct from auth.uid() then
    raise exception 'Only the author of a task can delete it';
  end if;

  update public.tasks set deleted_at = now() where id = p_task_id;
end;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ select role from public.profiles where id = auth.uid(); $$;


--
-- Name: tasks_after_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tasks_after_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.task_history (task_id, from_status, to_status, editor_id)
  values (new.id, null, new.status, coalesce(auth.uid(), new.author_id));

  return new;
end;
$$;


--
-- Name: tasks_before_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tasks_before_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  new.author_id := coalesce(auth.uid(), new.author_id);
  new.status := 'new';
  new.created_at := now();
  new.deleted_at := null;

  if not exists (
    select 1 from public.profiles
    where id = new.executor_id and role = 'executor'
  ) then
    raise exception 'Only a user with the executor role can be assigned as an executor.';
  end if;

  return new;
end;
$$;


--
-- Name: tasks_before_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tasks_before_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  if old.status = 'accepted'
     and (new.title is distinct from old.title or new.description is distinct from old.description) then
    raise exception 'An accepted task cannot be edited';
  end if;

  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: constructions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.constructions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    address text NOT NULL,
    author_id uuid NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    role public.user_role DEFAULT 'executor'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text
);


--
-- Name: status_transitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_transitions (
    from_status text NOT NULL,
    to_status text NOT NULL,
    role text NOT NULL,
    requires_comment boolean DEFAULT false NOT NULL,
    action_label text NOT NULL,
    CONSTRAINT status_transitions_role_check CHECK ((role = ANY (ARRAY['creator'::text, 'executor'::text])))
);


--
-- Name: statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statuses (
    id smallint NOT NULL,
    value text NOT NULL,
    label text NOT NULL
);


--
-- Name: statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.statuses ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: task_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_history (
    id bigint NOT NULL,
    task_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    editor_id uuid NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.task_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.task_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    construction_id uuid NOT NULL,
    executor_id uuid NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    author_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT tasks_description_check CHECK ((length(TRIM(BOTH FROM description)) > 0)),
    CONSTRAINT tasks_title_check CHECK ((length(TRIM(BOTH FROM title)) > 0))
);


--
-- Name: constructions constructions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constructions
    ADD CONSTRAINT constructions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: status_transitions status_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_transitions
    ADD CONSTRAINT status_transitions_pkey PRIMARY KEY (from_status, to_status);


--
-- Name: statuses statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_pkey PRIMARY KEY (id);


--
-- Name: statuses statuses_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_value_key UNIQUE (value);


--
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: task_history_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_history_task_id_idx ON public.task_history USING btree (task_id);


--
-- Name: constructions constructions_before_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER constructions_before_delete BEFORE DELETE ON public.constructions FOR EACH ROW EXECUTE FUNCTION public.constructions_before_delete();


--
-- Name: constructions constructions_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER constructions_before_insert BEFORE INSERT ON public.constructions FOR EACH ROW EXECUTE FUNCTION public.constructions_before_insert();


--
-- Name: tasks tasks_after_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_after_insert AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tasks_after_insert();


--
-- Name: tasks tasks_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_before_insert BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tasks_before_insert();


--
-- Name: tasks tasks_before_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_before_update BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tasks_before_update();


--
-- Name: constructions constructions_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constructions
    ADD CONSTRAINT constructions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: status_transitions status_transitions_from_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_transitions
    ADD CONSTRAINT status_transitions_from_status_fkey FOREIGN KEY (from_status) REFERENCES public.statuses(value);


--
-- Name: status_transitions status_transitions_to_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_transitions
    ADD CONSTRAINT status_transitions_to_status_fkey FOREIGN KEY (to_status) REFERENCES public.statuses(value);


--
-- Name: task_history task_history_editor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_editor_id_fkey FOREIGN KEY (editor_id) REFERENCES public.profiles(id);


--
-- Name: task_history task_history_from_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_from_status_fkey FOREIGN KEY (from_status) REFERENCES public.statuses(value);


--
-- Name: task_history task_history_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE RESTRICT;


--
-- Name: task_history task_history_to_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_to_status_fkey FOREIGN KEY (to_status) REFERENCES public.statuses(value);


--
-- Name: tasks tasks_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: tasks tasks_construction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_construction_id_fkey FOREIGN KEY (construction_id) REFERENCES public.constructions(id);


--
-- Name: tasks tasks_executor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_executor_id_fkey FOREIGN KEY (executor_id) REFERENCES public.profiles(id);


--
-- Name: tasks tasks_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_status_fkey FOREIGN KEY (status) REFERENCES public.statuses(value);


--
-- Name: constructions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.constructions ENABLE ROW LEVEL SECURITY;

--
-- Name: constructions constructions delete by author; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "constructions delete by author" ON public.constructions FOR DELETE TO authenticated USING (((public.get_my_role() = 'creator'::public.user_role) AND (author_id = auth.uid())));


--
-- Name: constructions constructions insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "constructions insert" ON public.constructions FOR INSERT TO authenticated WITH CHECK (((public.get_my_role() = 'creator'::public.user_role) AND (author_id = auth.uid())));


--
-- Name: constructions constructions select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "constructions select" ON public.constructions FOR SELECT TO authenticated USING (((public.get_my_role() = 'creator'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.construction_id = constructions.id) AND (t.executor_id = auth.uid()))))));


--
-- Name: constructions constructions update by author; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "constructions update by author" ON public.constructions FOR UPDATE TO authenticated USING (((public.get_my_role() = 'creator'::public.user_role) AND (author_id = auth.uid()))) WITH CHECK ((author_id = auth.uid()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles are readable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "profiles are readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: status_transitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.status_transitions ENABLE ROW LEVEL SECURITY;

--
-- Name: statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: statuses statuses are readable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "statuses are readable by authenticated" ON public.statuses FOR SELECT TO authenticated USING (true);


--
-- Name: task_history task history readable if task is visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "task history readable if task is visible" ON public.task_history FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE (t.id = task_history.task_id))));


--
-- Name: task_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks tasks insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "tasks insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (((public.get_my_role() = 'creator'::public.user_role) AND (author_id = auth.uid())));


--
-- Name: tasks tasks select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "tasks select" ON public.tasks FOR SELECT TO authenticated USING (((deleted_at IS NULL) AND ((public.get_my_role() = 'creator'::public.user_role) OR (executor_id = auth.uid()))));


--
-- Name: tasks tasks update by author; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "tasks update by author" ON public.tasks FOR UPDATE TO authenticated USING (((deleted_at IS NULL) AND (public.get_my_role() = 'creator'::public.user_role) AND (author_id = auth.uid()))) WITH CHECK ((author_id = auth.uid()));


--
-- Name: status_transitions transitions are readable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "transitions are readable by authenticated" ON public.status_transitions FOR SELECT TO authenticated USING (true);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION change_task_status(p_task_id uuid, p_to_status text, p_comment text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.change_task_status(p_task_id uuid, p_to_status text, p_comment text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.change_task_status(p_task_id uuid, p_to_status text, p_comment text) TO authenticated;
GRANT ALL ON FUNCTION public.change_task_status(p_task_id uuid, p_to_status text, p_comment text) TO service_role;


--
-- Name: FUNCTION constructions_before_delete(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.constructions_before_delete() TO anon;
GRANT ALL ON FUNCTION public.constructions_before_delete() TO authenticated;
GRANT ALL ON FUNCTION public.constructions_before_delete() TO service_role;


--
-- Name: FUNCTION constructions_before_insert(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.constructions_before_insert() TO anon;
GRANT ALL ON FUNCTION public.constructions_before_insert() TO authenticated;
GRANT ALL ON FUNCTION public.constructions_before_insert() TO service_role;


--
-- Name: FUNCTION delete_task(p_task_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_task(p_task_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_task(p_task_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.delete_task(p_task_id uuid) TO service_role;


--
-- Name: FUNCTION get_my_role(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_my_role() TO anon;
GRANT ALL ON FUNCTION public.get_my_role() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_role() TO service_role;


--
-- Name: FUNCTION tasks_after_insert(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tasks_after_insert() TO anon;
GRANT ALL ON FUNCTION public.tasks_after_insert() TO authenticated;
GRANT ALL ON FUNCTION public.tasks_after_insert() TO service_role;


--
-- Name: FUNCTION tasks_before_insert(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tasks_before_insert() TO anon;
GRANT ALL ON FUNCTION public.tasks_before_insert() TO authenticated;
GRANT ALL ON FUNCTION public.tasks_before_insert() TO service_role;


--
-- Name: FUNCTION tasks_before_update(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tasks_before_update() TO anon;
GRANT ALL ON FUNCTION public.tasks_before_update() TO authenticated;
GRANT ALL ON FUNCTION public.tasks_before_update() TO service_role;


--
-- Name: TABLE constructions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.constructions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.constructions TO authenticated;
GRANT ALL ON TABLE public.constructions TO service_role;


--
-- Name: COLUMN constructions.title; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(title) ON TABLE public.constructions TO authenticated;


--
-- Name: COLUMN constructions.address; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(address) ON TABLE public.constructions TO authenticated;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE status_transitions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.status_transitions TO anon;
GRANT ALL ON TABLE public.status_transitions TO authenticated;
GRANT ALL ON TABLE public.status_transitions TO service_role;


--
-- Name: TABLE statuses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.statuses TO anon;
GRANT ALL ON TABLE public.statuses TO authenticated;
GRANT ALL ON TABLE public.statuses TO service_role;


--
-- Name: SEQUENCE statuses_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.statuses_id_seq TO service_role;


--
-- Name: TABLE task_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.task_history TO anon;
GRANT ALL ON TABLE public.task_history TO authenticated;
GRANT ALL ON TABLE public.task_history TO service_role;


--
-- Name: SEQUENCE task_history_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.task_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.task_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.task_history_id_seq TO service_role;


--
-- Name: TABLE tasks; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.tasks TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.tasks TO service_role;


--
-- Name: COLUMN tasks.title; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(title) ON TABLE public.tasks TO authenticated;


--
-- Name: COLUMN tasks.description; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(description) ON TABLE public.tasks TO authenticated;


--
-- PostgreSQL database dump complete
--


