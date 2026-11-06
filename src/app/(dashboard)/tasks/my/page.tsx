import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Views */
import { TasksListPage } from '@/components/views/TasksListPage';

/* Skeletons */
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'My tasks'
	};
}

// Tasks assigned to the current executor; returns null for anyone who is not an executor
const getMyTasks = async () => {
	const supabase = await createClient();

	// getClaims verifies the JWT, so the user id can be trusted on the server
	const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

	if (claimsError) throw claimsError;

	const userId = claimsData?.claims.sub;

	// Guests are redirected by proxy.ts, this is just a safety net
	if (!userId) return null;

	const { data: role, error: roleError } = await supabase.rpc('get_my_role');

	if (roleError) throw roleError;

	if (role !== 'executor') return null;

	// RLS already limits an executor to own tasks; the filter keeps the intent explicit
	const { data, error } = await supabase
		.from('tasks')
		.select('id, title, description, status, construction_id, author_id, executor_id, created_at, statusInfo:statuses (label)')
		.eq('executor_id', userId)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error) throw error;

	return data;
};

const MyTasksList = async () => {
	await connection();

	const tasks = await getMyTasks();

	// The page exists only for executors
	if (!tasks) notFound();

	return <TasksListPage items={tasks} />;
};

const MyTasks = () => {
	return (
		<Suspense fallback={<ListSkeleton />}>
			<MyTasksList />
		</Suspense>
	);
};

export default MyTasks;
