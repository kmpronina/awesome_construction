'use client';

import React from 'react';
import { clsx } from 'clsx';

/* Primitives */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

/* UI */
import { Spinner } from '@/components/ui/Spinner';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/* DropdownMenuContent */

export interface DropdownMenuContentProps {
	ref?: React.Ref<HTMLDivElement>;
	className?: string;
	children: React.ReactNode;
	avoidCollisions?: boolean;
	onInteractOutside?: () => void;
}

const DropdownMenuContent = (props: DropdownMenuContentProps) => {
	const { ref, className, children, onInteractOutside, ...restProps } = props;

	const cn = clsx(
		'z-50 min-w-(--radix-dropdown-menu-trigger-width) rounded-md border border-zinc-200 bg-white p-1 text-sm text-foreground shadow-lg',
		'data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
		className
	);

	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				ref={ref}
				className={cn}
				side="bottom"
				sideOffset={4}
				align="center"
				alignOffset={0}
				onInteractOutside={onInteractOutside}
				avoidCollisions
				{...restProps}
			>
				{children}
			</DropdownMenuPrimitive.Content>
		</DropdownMenuPrimitive.Portal>
	);
};

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/* DropdownMenuItem */

export interface DropdownMenuItemProps {
	ref?: React.RefObject<HTMLDivElement>;
	className?: string;
	children: React.ReactNode;
	isLoading?: boolean;
	isDisabled?: boolean;
	onSelect: (event: Event) => void;
}

const DropdownMenuItem = (props: DropdownMenuItemProps) => {
	const { ref, className, children, onSelect, isLoading, isDisabled, ...restProps } = props;

	const cn = clsx(
		'flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-2 outline-none select-none transition-colors',
		'data-[highlighted]:bg-zinc-100 data-[highlighted]:text-green',
		'data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
		className
	);

	const drawVariant = React.useCallback(() => {
		if (isLoading) {
			return <Spinner size="md" className="shrink-0 text-zinc-500" />;
		}

		return null;
	}, [isLoading]);

	return (
		<DropdownMenuPrimitive.Item ref={ref} className={cn} onSelect={onSelect} disabled={isDisabled} {...restProps}>
			{children}

			{drawVariant()}
		</DropdownMenuPrimitive.Item>
	);
};

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* DropdownMenuSeparator */

export interface DropdownMenuSeparator {
	ref?: React.Ref<HTMLDivElement>;
	className?: string;
}

const DropdownMenuSeparator = (props: DropdownMenuSeparator) => {
	const { ref, className, ...restProps } = props;

	const cn = clsx('-mx-1 my-1 h-px bg-zinc-200', className);

	return <DropdownMenuPrimitive.Separator ref={ref} className={cn} {...restProps} />;
};

(DropdownMenuSeparator as any).displayName = DropdownMenuPrimitive.Separator.displayName;

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger };
