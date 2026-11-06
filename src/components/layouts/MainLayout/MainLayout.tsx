import React from 'react';

/* Components */
import Header from './Header/Header';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex min-h-dvh flex-1 flex-col">
			<Header />

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
		</div>
	);
};

export { MainLayout };
