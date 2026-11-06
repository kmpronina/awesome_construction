'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/* Types */
import type { TaskCreateFields, TaskUpdateFields } from '@/types';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Constants */
import { INVALID_UUID_CODE } from '@/utils/constants';

interface ActionError {
	error: string;
}

// RLS decides which tasks the current user can see; soft-deleted tasks are skipped
export const getTasks = async (constructionId: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('tasks')
		.select('id, title, description, status, construction_id, author_id, executor_id, created_at, statusInfo:statuses (label)')
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

	const supabase = await createClient();

	const { data: claimsData } = await supabase.auth.getClaims();
	const userId = claimsData?.claims.sub;

	if (!userId) return { error: 'You are not signed in' };

	// author_id is also set by the database trigger; it is passed here to satisfy the insert type
	const { error } = await supabase.from('tasks').insert({ title, description, construction_id, executor_id, author_id: userId });

	if (error) return { error: 'Failed to create task' };

	revalidatePath(`/constructions/${construction_id}`);

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/constructions/${construction_id}`);
};

// Errors raised by our database functions (raise exception) are meant for users
const RAISE_EXCEPTION_CODE = 'P0001';

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
	const supabase = await createClient();

	// getClaims verifies the JWT, so the user id can be trusted on the server
	const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

	if (claimsError) throw claimsError;

	const userId = claimsData?.claims.sub;

	if (!userId) return null;

	const { data, error } = await supabase
		.from('tasks')
		.select('id, title, description, status, construction_id, author_id, executor_id, created_at')
		.eq('id', id)
		.is('deleted_at', null)
		.maybeSingle();

	if (error?.code === INVALID_UUID_CODE) return null;

	if (error) throw error;

	if (!data || data.author_id !== userId) return null;

	return data;
};
