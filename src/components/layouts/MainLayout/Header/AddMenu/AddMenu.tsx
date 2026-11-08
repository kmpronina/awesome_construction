'use client';

import { useRouter } from 'next/navigation';

/* UI */
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

/* Stores */
import { useUserStore } from '@/stores';

const ADD_ITEMS = [
	{ href: '/constructions/add', label: 'Объект' },
	{ href: '/tasks/add', label: 'Задачу' }
];

const PlusIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
		<path d="M12 5v14M5 12h14" />
	</svg>
);

// Shown only to creators; the add pages and RLS check the role again on the server
const AddMenu = () => {
	const router = useRouter();

	const role = useUserStore((state) => state.user?.role);

	if (role !== 'creator') return null;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-light px-3 text-sm font-medium text-green transition-colors hover:bg-light/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-light"
				>
					<PlusIcon />
					Добавить
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="min-w-40">
				{ADD_ITEMS.map((item) => (
					<DropdownMenuItem key={item.href} onSelect={() => router.push(item.href)}>
						{item.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AddMenu;
