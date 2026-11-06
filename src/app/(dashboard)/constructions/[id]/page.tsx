import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Actions */
import { getConstruction } from '@/actions/constructions';
import { getTasks } from '@/actions/tasks';

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

	const [construction, tasks] = await Promise.all([getConstruction(id), getTasks(id)]);

	// Missing record or hidden by RLS: show the 404 page
	if (!construction) notFound();

	return <ConstructionItemPage item={construction} tasks={tasks} />;
};

const Construction = ({ params }: PageProps<'/constructions/[id]'>) => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<ConstructionItem params={params} />
		</Suspense>
	);
};

export default Construction;
