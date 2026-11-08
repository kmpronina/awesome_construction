import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Actions */
import { getIsCreator } from '@/actions/users';

/* Forms */
import { ConstructionForm } from '@/components/forms/ConstructionForm';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Новый объект'
	};
}

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
