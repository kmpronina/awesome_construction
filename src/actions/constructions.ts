'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/* Types */
import type { ConstructionFields } from '@/types';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Actions */
import { getUserId } from '@/actions/users';

/* Constants */
import { INVALID_UUID_CODE } from '@/utils/constants';

interface ActionError {
	error: string;
}

// Errors raised by our database triggers (raise exception) are meant for users
const RAISE_EXCEPTION_CODE = 'P0001';

// RLS decides which constructions the user sees: a creator sees all, an executor only those with own tasks.
// 'title' suits selects in forms, 'newest' suits the list page
export const getConstructions = async (order: 'title' | 'newest' = 'title') => {
	const supabase = await createClient();

	const query = supabase.from('constructions').select('id, title, address, author_id, created_at');

	const { data, error } = order === 'newest' ? await query.order('created_at', { ascending: false }) : await query.order('title');

	if (error) throw error;

	return data;
};

export const getConstruction = async (id: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('constructions').select('id, title, address, author_id, created_at').eq('id', id).maybeSingle();

	if (error?.code === INVALID_UUID_CODE) return null;

	if (error) throw error;

	return data;
};

// Runs on the server with the user's session, so the insert goes through RLS:
// only a creator can add a construction, and author_id must be the current user
export const createConstruction = async (fields: ConstructionFields): Promise<ActionError> => {
	// Never trust client-side validation in a Server Function
	const title = fields.title.trim();
	const address = fields.address.trim();

	if (!title || !address) return { error: 'Укажите название и адрес' };

	const [supabase, userId] = await Promise.all([createClient(), getUserId()]);

	if (!userId) return { error: 'Вы не вошли в систему' };

	// author_id is also set by the database trigger; it is passed here to satisfy the insert type
	const { data, error } = await supabase.from('constructions').insert({ title, address, author_id: userId }).select('id').single();

	if (error) return { error: 'Не удалось создать объект' };

	revalidatePath('/constructions');

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/constructions/${data.id}`);
};

// The update goes through RLS: only the construction author (a creator) can edit it,
// and only title and address are granted for update
export const updateConstruction = async (constructionId: string, fields: ConstructionFields): Promise<ActionError> => {
	// Never trust client-side validation in a Server Function
	const title = fields.title.trim();
	const address = fields.address.trim();

	if (!title || !address) return { error: 'Укажите название и адрес' };

	const supabase = await createClient();

	// select() returns the updated rows: if RLS filtered the construction out, nothing is updated and no error is returned
	const { data, error } = await supabase.from('constructions').update({ title, address }).eq('id', constructionId).select('id');

	if (error) return { error: 'Не удалось сохранить объект' };

	if (data.length === 0) return { error: 'Объект не найден или у вас нет прав на его изменение' };

	revalidatePath('/constructions');
	revalidatePath(`/constructions/${constructionId}`);

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/constructions/${constructionId}`);
};

// The delete goes through RLS: only the construction author (a creator) can delete it.
// A database trigger rejects deleting a construction that has tasks, soft-deleted ones included
export const deleteConstruction = async (constructionId: string): Promise<ActionError> => {
	const supabase = await createClient();

	// select() returns the deleted rows: if RLS filtered the construction out, nothing is deleted and no error is returned
	const { data, error } = await supabase.from('constructions').delete().eq('id', constructionId).select('id');

	if (error) return { error: error.code === RAISE_EXCEPTION_CODE ? error.message : 'Не удалось удалить объект' };

	if (data.length === 0) return { error: 'Объект не найден или у вас нет прав на его удаление' };

	revalidatePath('/constructions');

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect('/constructions');
};
