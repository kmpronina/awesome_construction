import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Forms */
import { TaskForm } from '@/components/forms/TaskForm';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Add task'
	};
}

// Only creators can add tasks; the insert policy enforces the same rule in the database
const getIsCreator = async () => {
	const supabase = await createClient();

	const { data: role, error } = await supabase.rpc('get_my_role');

	if (error) throw error;

	return role === 'creator';
};

// Requires a select policy on profiles for authenticated users, otherwise the list is empty
const getExecutors = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('profiles').select('id, email, name, role').eq('role', 'executor').order('name');

	if (error) throw error;

	return data;
};

// A creator sees all constructions through RLS, so any of them can get a task
const getConstructions = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('constructions').select('id, title, address, author_id, created_at').order('title');

	if (error) throw error;

	return data;
};

const AddTaskForm = async () => {
	await connection();

	const isCreator = await getIsCreator();

	if (!isCreator) notFound();

	const [executors, constructions] = await Promise.all([getExecutors(), getConstructions()]);

	return <TaskForm executors={executors} constructions={constructions} />;
};

const AddTask = () => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<AddTaskForm />
		</Suspense>
	);
};

export default AddTask;
