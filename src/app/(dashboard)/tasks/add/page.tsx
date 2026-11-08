import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Actions */
import { getConstructions } from '@/actions/constructions';
import { getExecutors, getIsCreator } from '@/actions/users';

/* Forms */
import { TaskForm } from '@/components/forms/TaskForm';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Новая задача'
	};
}

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
