import React from 'react';
import { clsx } from 'clsx';

/* Types */
import { SelectItem } from '@/types';

interface InputTriggerProps {
	ref?: React.RefObject<HTMLDivElement>;
	className?: string;
	value?: string | number | null;
	valueSelect?: SelectItem | null;
	placeholder?: string;
	isInvalid?: boolean;
	isDisabled?: boolean;
	onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const ArrowIcon = () => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden
		className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
);

const InputTrigger = (props: InputTriggerProps) => {
	const { ref, className, value, valueSelect, placeholder, isInvalid, isDisabled, onKeyDown, ...restProps } = props;

	// Same look as Input; the open state (data-state="open", set by Radix triggers) looks like focus
	const cn = clsx(
		'group flex h-10 w-full min-w-[110px] cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm text-foreground transition-colors outline-none',
		'focus:ring-2 data-[state=open]:ring-2',
		isInvalid
			? 'border-red-500 focus:ring-red-500/20 data-[state=open]:ring-red-500/20'
			: 'border-zinc-300 focus:border-green focus:ring-green/20 data-[state=open]:border-green data-[state=open]:ring-green/20',
		isDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
		className
	);

	const label = valueSelect?.label ?? value;

	return (
		<div
			ref={ref}
			className={cn}
			{...restProps}
			tabIndex={isDisabled ? -1 : 0}
			aria-disabled={isDisabled || undefined}
			aria-invalid={isInvalid || undefined}
			onKeyDown={onKeyDown}
		>
			<div className={clsx('min-w-0 flex-1 truncate', !label && 'text-zinc-400')}>{label || placeholder}</div>

			<div className="flex shrink-0 items-center text-zinc-500">
				<ArrowIcon />
			</div>
		</div>
	);
};

InputTrigger.displayName = 'InputTrigger';

export { InputTrigger };
