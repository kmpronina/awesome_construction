import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

/* Libs */
import { createClient } from '@/libs/supabase/server';

/* Actions */
import { getConstruction } from '@/actions/constructions';
import { getIsCreator } from '@/actions/users';

/* Forms */
import { ConstructionForm } from '@/components/forms/ConstructionForm';

/* Skeletons */
import { ItemSkeleton } from '@/components/skeletons/ItemSkeleton';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Edit construction'
	};
}

// getClaims verifies the JWT, so the user id can be trusted on the server
const getUserId = async () => {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();

	if (error) throw error;

	return data?.claims.sub ?? null;
};

const EditConstructionForm = async ({ params }: { params: Promise<{ id: string }> }) => {
	await connection();

	const { id } = await params;

	const [isCreator, userId, construction] = await Promise.all([getIsCreator(), getUserId(), getConstruction(id)]);

	// Missing, hidden by RLS or not the author: show the 404 page.
	// RLS lets any creator read a construction, but only the author can update it
	if (!isCreator || !construction || construction.author_id !== userId) notFound();

	return <ConstructionForm item={construction} />;
};

const EditConstruction = ({ params }: PageProps<'/constructions/[id]/edit'>) => {
	return (
		<Suspense fallback={<ItemSkeleton />}>
			<EditConstructionForm params={params} />
		</Suspense>
	);
};

export default EditConstruction;
