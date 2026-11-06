'use client';

import React from 'react';
import { clsx } from 'clsx';

/* Primitives */
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

export interface ScrollAreaProps {
	ref?: React.Ref<HTMLDivElement>;
	className?: string;
	children: React.ReactNode;
}

const ScrollArea = (props: ScrollAreaProps) => {
	const { ref, className, children, ...restProps } = props;

	// Temporary fix
	// https://github.com/radix-ui/primitives/issues/926
	const cnViewport = clsx('size-full [&>div]:block!', className);

	return (
		<ScrollAreaPrimitive.Root ref={ref} className="relative w-full" type="always" {...restProps}>
			<ScrollAreaPrimitive.Viewport className={cnViewport}>{children}</ScrollAreaPrimitive.Viewport>

			<ScrollBar />

			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
};

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/* ScrollBar */

export interface ScrollBarProps {
	ref?: React.RefObject<HTMLDivElement>;
}

const ScrollBar = (props: ScrollBarProps) => {
	const { ref, ...restProps } = props;

	return (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			ref={ref}
			orientation="vertical"
			className="flex w-1 touch-none select-none"
			style={{
				right: `-6px`,
				bottom: 'var(--radix-scroll-area-corner-width)'
			}}
			{...restProps}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-zinc-300 transition-colors hover:bg-zinc-400" />
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	);
};

ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea };
