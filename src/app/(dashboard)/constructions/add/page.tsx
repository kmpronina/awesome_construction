import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Forms */
import { ConstructionForm } from '@/components/forms/ConstructionForm';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Add construction'
	};
}

// Only creators can add constructions; the insert policy enforces the same rule in the database
const getIsCreator = async () => {
	const supabase = await createClient();

	const { data: role, error } = await supabase.rpc('get_my_role');

	if (error) throw error;

	return role === 'creator';
};

const AddConstructionForm = async () => {
	await connection();

	const isCreator = await getIsCreator();

	if (!isCreator) notFound();

	return <ConstructionForm />;
};

const AddConstruction = () => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<AddConstructionForm />
		</Suspense>
	);
};

export default AddConstruction;
