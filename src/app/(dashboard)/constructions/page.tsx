import { Suspense } from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Views */
import { ConstructionsListPage } from '@/components/views/ConstructionsListPage';

/* Skeletons */
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Constructions'
	};
}

// Server client reads the session from cookies, so RLS applies exactly as for the signed-in user
const getConstructions = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.from('constructions').select('id, title, address, author_id, created_at').order('created_at', { ascending: false });

	// Let the nearest error.tsx handle it instead of showing an empty list
	if (error) throw error;

	return data;
};

const ConstructionsList = async () => {
	await connection();

	const constructions = await getConstructions();

	return <ConstructionsListPage items={constructions} />;
};

const Constructions = () => {
	return (
		<Suspense fallback={<ListSkeleton />}>
			<ConstructionsList />
		</Suspense>
	);
};

export default Constructions;
