/* Libs */
import { createClient } from '@/libs/supabase/server';

// Only creators can add tasks; the insert policy enforces the same rule in the database
export const getIsCreator = async () => {
	const supabase = await createClient();

	const { data: role, error } = await supabase.rpc('get_my_role');

	if (error) throw error;

	return role === 'creator';
};

// Requires a select policy on profiles for authenticated users, otherwise the list is empty
export const getExecutors = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('profiles').select('id, email, name, role').eq('role', 'executor').order('name');

	if (error) throw error;

	return data;
};
