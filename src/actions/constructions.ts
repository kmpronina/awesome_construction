'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/* Types */
import type { ConstructionFields } from '@/types';

/* Libs */
import { createClient } from '@/libs/supabase/server';

interface ActionError {
	error: string;
}

// Runs on the server with the user's session, so the insert goes through RLS:
// only a creator can add a construction, and author_id must be the current user
export const createConstruction = async (fields: ConstructionFields): Promise<ActionError> => {
	// Never trust client-side validation in a Server Function
	const title = fields.title.trim();
	const address = fields.address.trim();

	if (!title || !address) return { error: 'Title and address are required' };

	const supabase = await createClient();

	const { data: claimsData } = await supabase.auth.getClaims();
	const userId = claimsData?.claims.sub;

	if (!userId) return { error: 'You are not signed in' };

	// author_id is also set by the database trigger; it is passed here to satisfy the insert type
	const { data, error } = await supabase.from('constructions').insert({ title, address, author_id: userId }).select('id').single();

	if (error) return { error: 'Failed to create construction' };

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

	if (!title || !address) return { error: 'Title and address are required' };

	const supabase = await createClient();

	// select() returns the updated rows: if RLS filtered the construction out, nothing is updated and no error is returned
	const { data, error } = await supabase.from('constructions').update({ title, address }).eq('id', constructionId).select('id');

	if (error) return { error: 'Failed to update construction' };

	if (data.length === 0) return { error: 'Construction not found or you cannot edit it' };

	revalidatePath('/constructions');
	revalidatePath(`/constructions/${constructionId}`);

	// redirect throws a framework exception, so it must stay outside try/catch
	redirect(`/constructions/${constructionId}`);
};
