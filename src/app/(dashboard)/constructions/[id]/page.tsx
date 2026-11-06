import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Actions */
import { getConstruction } from '@/actions/constructions';
import { getTasks } from '@/actions/tasks';
import { getUserId } from '@/actions/users';

/* Views */
import { ConstructionItemPage } from '@/components/views/ConstructionItemPage';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Construction'
	};
}

const ConstructionItem = async ({ params }: { params: Promise<{ id: string }> }) => {
	await connection();

	const { id } = await params;

	const [construction, tasks, userId] = await Promise.all([getConstruction(id), getTasks(id), getUserId()]);

	// Missing record or hidden by RLS: show the 404 page
	if (!construction) notFound();

	// Only the author can edit; the edit page and RLS check it too
	const canEdit = construction.author_id === userId;

	return <ConstructionItemPage item={construction} tasks={tasks} canEdit={canEdit} />;
};

const Construction = ({ params }: PageProps<'/constructions/[id]'>) => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<ConstructionItem params={params} />
		</Suspense>
	);
};

export default Construction;
