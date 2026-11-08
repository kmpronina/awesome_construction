import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

/* Actions */
import { getConstructions } from '@/actions/constructions';
import { getOwnTask } from '@/actions/tasks';
import { getExecutors, getIsCreator } from '@/actions/users';

/* Forms */
import { TaskForm } from '@/components/forms/TaskForm';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Редактирование задачи'
	};
}

const EditTaskForm = async ({ params }: { params: Promise<{ id: string }> }) => {
	await connection();

	const { id } = await params;

	const [isCreator, task] = await Promise.all([getIsCreator(), getOwnTask(id)]);

	// Missing, deleted, hidden by RLS or not the author: show the 404 page
	if (!isCreator || !task) notFound();

	// An accepted task cannot be edited (a database trigger rejects it), so go back to the task page
	if (task.status === 'accepted') redirect(`/tasks/${task.id}`);

	const [executors, constructions] = await Promise.all([getExecutors(), getConstructions()]);

	return <TaskForm item={task} executors={executors} constructions={constructions} />;
};

const EditTask = ({ params }: PageProps<'/tasks/[id]/edit'>) => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<EditTaskForm params={params} />
		</Suspense>
	);
};

export default EditTask;
