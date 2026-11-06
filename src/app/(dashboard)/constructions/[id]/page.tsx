import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Constants */
import { INVALID_UUID_CODE } from '@/utils/constants';

/* Views */
import { ConstructionItemPage } from '@/components/views/ConstructionItemPage';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Construction'
	};
}

const getConstruction = async (id: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('constructions').select('id, title, address, author_id, created_at').eq('id', id).maybeSingle();

	if (error?.code === INVALID_UUID_CODE) return null;

	if (error) throw error;

	return data;
};

// RLS decides which tasks the current user can see; soft-deleted tasks are skipped
const getTasks = async (constructionId: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('tasks')
		.select('id, title, description, status, construction_id, author_id, executor_id, created_at, statusInfo:statuses (label)')
		.eq('construction_id', constructionId)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error?.code === INVALID_UUID_CODE) return [];

	if (error) throw error;

	return data;
};

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
