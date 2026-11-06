'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/* Types */
import type { TaskAccess, TaskCreateFields, TaskUpdateFields } from '@/types';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Actions */
import { getUserId, getViewer, type Viewer } from '@/actions/users';

/* Constants */
import { INVALID_UUID_CODE } from '@/utils/constants';

interface ActionError {
	error: string;
}

// Errors raised by our database functions (raise exception) are meant for users
const RAISE_EXCEPTION_CODE = 'P0001';

// Columns of a task row used across pages; the list adds the status label from the statuses table
const TASK_FIELDS = 'id, title, description, status, construction_id, author_id, executor_id, created_at';
const TASK_LIST_FIELDS = `${TASK_FIELDS}, statusInfo:statuses (label)` as const;

// RLS decides which tasks the current user can see; soft-deleted tasks are skipped
export const getTasks = async (constructionId: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('tasks')
		.select(TASK_LIST_FIELDS)
		.eq('construction_id', constructionId)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error?.code === INVALID_UUID_CODE) return [];

	if (error) throw error;

	return data;
};

// Runs with the user's session, so the insert goes through RLS: only a creator can add a task.
// Status, author and the first history row are set by the database triggers,
// which also reject an executor_id that does not belong to an executor
export const createTask = async (fields: TaskCreateFields): Promise<ActionError> => {
	// Never trust client-side validation in a Server Function
	const title = fields.title.trim();
	const description = fields.description.trim();
	const { construction_id, executor_id } = fields;

	if (!title || !description || !construction_id || !executor_id) return { error: 'All fields are required' };

	const [supabase, userId] = await Promise.all([createClient(), getUserId()]);

	if (!userId) return { error: 'You are not signed in' };

	// author_id is also set by the database trigger; it is passed here to satisfy the insert type
	const { error } = await supabase.from('tasks').insert({ title, description, construction_id, executor_id, author_id: userId });

	if (error) return { error: 'Failed to create task' };

	revalidatePath(`/constructions/${construction_id}`);

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/constructions/${construction_id}`);
};

// All rules are enforced by change_task_status in the database: allowed transition,
// role, task ownership and the required comment. The UI only hides unavailable actions
export const changeTaskStatus = async (taskId: string, toStatus: string, comment: string): Promise<ActionError | null> => {
	const supabase = await createClient();

	const { error } = await supabase.rpc('change_task_status', {
		p_task_id: taskId,
		p_to_status: toStatus,
		p_comment: comment.trim() || undefined
	});

	if (error) return { error: error.code === RAISE_EXCEPTION_CODE ? error.message : 'Failed to change status' };

	revalidatePath(`/tasks/${taskId}`);

	return null;
};

// The update goes through RLS: only the task author (a creator) can edit, and only title and description
// are granted for update. A trigger rejects edits of accepted tasks
export const updateTask = async (taskId: string, fields: TaskUpdateFields): Promise<ActionError> => {
	const title = fields.title.trim();
	const description = fields.description.trim();

	if (!title || !description) return { error: 'Title and description are required' };

	const supabase = await createClient();

	// select() returns the updated rows: if RLS filtered the task out, nothing is updated and no error is returned
	const { data, error } = await supabase.from('tasks').update({ title, description }).eq('id', taskId).is('deleted_at', null).select('id');

	if (error) return { error: error.code === RAISE_EXCEPTION_CODE ? error.message : 'Failed to update task' };

	if (data.length === 0) return { error: 'Task not found or you cannot edit it' };

	revalidatePath(`/tasks/${taskId}`);

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/tasks/${taskId}`);
};

// Returns the task only if the current user is its author; null otherwise.
// RLS lets any creator read the task, but only the author can update it
export const getOwnTask = async (id: string) => {
	const [supabase, userId] = await Promise.all([createClient(), getUserId()]);

	if (!userId) return null;

	const { data, error } = await supabase.from('tasks').select(TASK_FIELDS).eq('id', id).is('deleted_at', null).maybeSingle();

	if (error?.code === INVALID_UUID_CODE) return null;

	if (error) throw error;

	if (!data || data.author_id !== userId) return null;

	return data;
};

// Tasks assigned to the current executor; null for anyone who is not an executor
export const getMyTasks = async () => {
	const { userId, role } = await getViewer();

	// Guests are redirected by proxy.ts, this is just a safety net
	if (!userId || role !== 'executor') return null;

	const supabase = await createClient();

	// RLS already limits an executor to own tasks; the filter keeps the intent explicit
	const { data, error } = await supabase
		.from('tasks')
		.select(TASK_LIST_FIELDS)
		.eq('executor_id', userId)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error) throw error;

	return data;
};

// RLS decides access: a creator can read every task, an executor only own tasks;
// soft-deleted tasks are hidden for everyone.
// profiles has two foreign keys from tasks, so the relation name picks the right one
export const getTask = async (id: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('tasks')
		.select(
			`id, title, description, status, construction_id, author_id, executor_id, created_at,
			construction:constructions (id, title),
			executor:profiles!tasks_executor_id_fkey (id, name, email),
			author:profiles!tasks_author_id_fkey (id, name, email),
			statusInfo:statuses (label)`
		)
		.eq('id', id)
		.is('deleted_at', null)
		.maybeSingle();

	if (error?.code === INVALID_UUID_CODE) return null;

	if (error) throw error;

	return data;
};

// Status changes the current user can make right now. This only decides which buttons to show:
// change_task_status re-checks the same rules in the database
export const getTransitions = async (task: TaskAccess, viewer: Viewer) => {
	const { userId, role } = viewer;

	// A creator acts only on own tasks, an executor only on tasks assigned to them
	const isParticipant = (role === 'creator' && task.author_id === userId) || (role === 'executor' && task.executor_id === userId);

	if (!userId || !role || !isParticipant) return [];

	const supabase = await createClient();

	const { data, error } = await supabase
		.from('status_transitions')
		.select('to_status, action_label, requires_comment')
		.eq('from_status', task.status)
		.eq('role', role);

	if (error) throw error;

	return data;
};

// Status changes of the task, oldest first. RLS on task_history shows it only if the task itself is visible.
// statuses is referenced twice (from/to), so the foreign key name picks the right relation
export const getHistory = async (taskId: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('task_history')
		.select(
			`id, from_status, to_status, comment, created_at,
			editor:profiles (id, name, email),
			fromStatusInfo:statuses!task_history_from_status_fkey (label),
			toStatusInfo:statuses!task_history_to_status_fkey (label)`
		)
		.eq('task_id', taskId)
		.order('created_at', { ascending: true });

	if (error) throw error;

	return data;
};

// Soft delete through the delete_task database function: only the task author (a creator) can delete,
// the task stays in the database with deleted_at set and disappears for everyone through RLS
export const deleteTask = async (taskId: string, constructionId: string): Promise<ActionError> => {
	const supabase = await createClient();

	const { error } = await supabase.rpc('delete_task', { p_task_id: taskId });

	if (error) return { error: error.code === RAISE_EXCEPTION_CODE ? error.message : 'Failed to delete task' };

	revalidatePath(`/constructions/${constructionId}`);
	revalidatePath('/tasks/my');

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/constructions/${constructionId}`);
};
