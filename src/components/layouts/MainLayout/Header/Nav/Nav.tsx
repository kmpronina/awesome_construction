import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

/* Types */
import { UserRole } from '@/types/stores/userStore';

/* Stores */
import { useUserStore } from '@/stores';

interface NavItem {
	href: string;
	label: string;
	roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
	{ href: '/constructions', label: 'Home' },
	{ href: '/tasks/my', label: 'My tasks', roles: ['executor'] }
];

interface NavProps {
	items: NavItem[];
	pathname?: string;
}

const Nav = (props: NavProps) => {
	const { items, pathname } = props;

	return (
		<nav>
			<ul className="flex items-center gap-1">
				{items.map((item) => {
					const isActive = pathname === item.href;

					return (
						<li key={item.href}>
							<Link
								href={item.href}
								aria-current={isActive ? 'page' : undefined}
								className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-light ${
									isActive ? 'bg-light text-green' : 'text-light/80 hover:bg-light/10 hover:text-light'
								}`}
							>
								{item.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

// usePathname is request data on dynamic routes, so it lives behind Suspense;
// the fallback is the same Nav without the active highlight
const ActiveNav = (props: Omit<NavProps, 'pathname'>) => {
	const pathname = usePathname();

	return <Nav {...props} pathname={pathname} />;
};

const RelativeNav = () => {
	const [role] = useUserStore((state) => [state.user?.role]);

	const items = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

	return (
		<React.Suspense fallback={<Nav items={items} />}>
			<ActiveNav items={items} />
		</React.Suspense>
	);
};

export default RelativeNav;
