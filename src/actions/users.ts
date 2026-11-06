/* Libs */
import { createClient } from '@/libs/supabase/server';

// getClaims verifies the JWT, so the user id can be trusted on the server
export const getUserId = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();

	if (error) throw error;

	return data?.claims.sub ?? null;
};

// Role from public.profiles; null for a user without a profile
export const getMyRole = async () => {
	const supabase = await createClient();

	const { data: role, error } = await supabase.rpc('get_my_role');

	if (error) throw error;

	return role;
};

// The current user's id and role, loaded together
export const getViewer = async () => {
	const [userId, role] = await Promise.all([getUserId(), getMyRole()]);

	return { userId, role };
};

export type Viewer = Awaited<ReturnType<typeof getViewer>>;

// Only creators can add tasks and constructions; the insert policies enforce the same rule in the database
export const getIsCreator = async () => {
	const role = await getMyRole();

	return role === 'creator';
};

// Requires a select policy on profiles for authenticated users, otherwise the list is empty
export const getExecutors = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('profiles').select('id, email, name, role').eq('role', 'executor').order('name');

	if (error) throw error;

	return data;
};
