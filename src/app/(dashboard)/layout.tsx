'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/* Layouts */
import { MainLayout } from '@/components/layouts/MainLayout';

/* Stores */
import { useUserStore } from '@/stores';

export default function Layout({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const [loaded, userId] = useUserStore((state) => [state.loaded, state.user?.id]);

	// Guests are redirected by proxy.ts on the server.
	// This only handles logout: the auth check is finished and there is no user anymore
	React.useEffect(() => {
		if (loaded && !userId) {
			router.replace('/login');
		}
	}, [loaded, userId, router]);

	return <MainLayout>{children}</MainLayout>;
}
