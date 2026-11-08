'use client';

import Link from 'next/link';
import React from 'react';

/* UI */
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toaster';

/* Local */
import AddMenu from './AddMenu/AddMenu';
import RelativeNav from './Nav/Nav';

/* Stores */
import { useUserStore } from '@/stores';

const Header = () => {
	const [doLogout] = useUserStore((state) => [state.doLogout]);

	const [isLoggingOut, setIsLoggingOut] = React.useState(false);

	// The redirect to /login is done by the dashboard layout once the user is cleared
	const handleLogout = () => {
		setIsLoggingOut(true);

		doLogout()
			.catch(() => {
				toast.error('Не удалось выйти');
			})
			.finally(() => {
				setIsLoggingOut(false);
			});
	};

	return (
		<header className="sticky top-0 z-10 bg-green text-light shadow-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4">
				<Link href="/constructions" className="hidden text-lg font-bold tracking-wide sm:block">
					Awesome Construction
				</Link>

				<div className="flex items-center gap-4">
					<RelativeNav />

					<AddMenu />

					<button
						type="button"
						className="flex h-9 min-w-20 cursor-pointer items-center justify-center rounded-md border border-light/30 px-3 text-sm font-medium text-light transition-colors hover:bg-light/10 focus-visible:outline-2 focus-visible:outline-light disabled:cursor-not-allowed disabled:opacity-60"
						disabled={isLoggingOut}
						onClick={handleLogout}
					>
						{isLoggingOut ? <Spinner size="md" /> : 'Выйти'}
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;
