import React from 'react';

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex min-h-dvh flex-1 items-center justify-center bg-green px-4 text-center text-3xl font-bold tracking-wide text-light sm:text-5xl">
			{children}
		</div>
	);
};

export { GuestLayout };
