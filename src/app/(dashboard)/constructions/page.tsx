import { Suspense } from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';

/* Actions */
import { getConstructions } from '@/actions/constructions';

/* Views */
import { ConstructionsListPage } from '@/components/views/ConstructionsListPage';

/* Skeletons */
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Constructions'
	};
}

const ConstructionsList = async () => {
	await connection();

	const constructions = await getConstructions('newest');

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
