import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Constants */
import { INVALID_UUID_CODE } from '@/utils/constants';

/* Views */
import { TaskItemPage } from '@/components/views/TaskItemPage';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Task'
	};
}

// RLS decides access: a creator can read every task, an executor only own tasks;
// soft-deleted tasks are hidden for everyone.
// profiles has two foreign keys from tasks, so the relation name picks the right one
const getTask = async (id: string) => {
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
const getTransitions = async (task: { status: string; author_id: string; executor_id: string }) => {
	const supabase = await createClient();

	const [{ data: claimsData, error: claimsError }, { data: role, error: roleError }] = await Promise.all([
		supabase.auth.getClaims(),
		supabase.rpc('get_my_role')
	]);

	if (claimsError) throw claimsError;
	if (roleError) throw roleError;

	const userId = claimsData?.claims.sub;

	// A creator acts only on own tasks, an executor only on tasks assigned to them
	const isParticipant = (role === 'creator' && task.author_id === userId) || (role === 'executor' && task.executor_id === userId);

	if (!userId || !role || !isParticipant) return [];

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
const getHistory = async (taskId: string) => {
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

const TaskItem = async ({ params }: { params: Promise<{ id: string }> }) => {
	await connection();

	const { id } = await params;

	const task = await getTask(id);

	// Missing, deleted or hidden by RLS: show the 404 page
	if (!task) notFound();

	const [transitions, history] = await Promise.all([getTransitions(task), getHistory(task.id)]);

	return <TaskItemPage item={task} transitions={transitions} history={history} />;
};

const Task = ({ params }: PageProps<'/tasks/[id]'>) => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<TaskItem params={params} />
		</Suspense>
	);
};

export default Task;
