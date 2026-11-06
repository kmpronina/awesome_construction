import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Types */
import type { TaskAccess } from '@/types';

/* Actions */
import { getHistory, getTask, getTransitions } from '@/actions/tasks';
import { getViewer, type Viewer } from '@/actions/users';

/* Views */
import { TaskItemPage } from '@/components/views/TaskItemPage';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Task'
	};
}

// Only the author can edit, and an accepted task cannot be edited (the edit page and a trigger check it too)
const getCanEdit = (task: TaskAccess, viewer: Viewer) => {
	return viewer.role === 'creator' && task.author_id === viewer.userId && task.status !== 'accepted';
};

const TaskItem = async ({ params }: { params: Promise<{ id: string }> }) => {
	await connection();

	const { id } = await params;

	const task = await getTask(id);

	// Missing, deleted or hidden by RLS: show the 404 page
	if (!task) notFound();

	const viewer = await getViewer();

	const [transitions, history] = await Promise.all([getTransitions(task, viewer), getHistory(task.id)]);

	return <TaskItemPage item={task} transitions={transitions} history={history} canEdit={getCanEdit(task, viewer)} />;
};

const Task = ({ params }: PageProps<'/tasks/[id]'>) => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<TaskItem params={params} />
		</Suspense>
	);
};

export default Task;
