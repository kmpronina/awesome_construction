'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/* Layouts */
import { GuestLayout } from '@/components/layouts/GuestLayout';

/* Stores */
import { useUserStore } from '@/stores';

export default function Layout({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const [userId] = useUserStore((state) => [state.user?.id]);

	// Signed-in users are redirected by proxy.ts on the server.
	// This only handles a successful login on this page
	React.useEffect(() => {
		if (userId) {
			router.replace('/constructions');
		}
	}, [userId, router]);

	return <GuestLayout>{children}</GuestLayout>;
}
