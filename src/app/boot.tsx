'use client';

import React from 'react';

/* Stores */
import { useUserStore } from '@/stores';

interface BootProps {
	children: React.ReactNode;
}

const Boot = (props: BootProps) => {
	const { children } = props;

	const [loaded, tryAuth, clearUser] = useUserStore((state) => [state.loaded, state.tryAuth, state.clearUser]);

	React.useEffect(() => {
		if (loaded) return;

		tryAuth()
			.then(() => {
				console.log('>> auth complete');
			})
			.catch(() => {
				clearUser();

				console.log('>> auth failed');
			});
	}, []); // eslint-disable-line

	return children;
};

export { Boot };
