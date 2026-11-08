import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Actions */
import { getMyTasks } from '@/actions/tasks';

/* Views */
import { TasksListPage } from '@/components/views/TasksListPage';

/* Skeletons */
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Мои задачи'
	};
}

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
