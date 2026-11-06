'use client';

import React from 'react';
import { clsx } from 'clsx';

export type InputValues = string | number | null | undefined;

export interface InputProps {
	ref?: React.RefObject<HTMLDivElement>;
	className?: string;
	type?: string;
	id?: string;
	name?: string;
	value?: InputValues;
	placeholder?: string;
	min?: number;
	max?: number;
	append?: React.ReactNode;
	isInvalid?: boolean;
	isDisabled?: boolean;
	isReadonly?: boolean;
	onChange?: (value: string) => void;
}

const Input = (props: InputProps) => {
	const {
		ref,
		className,
		type = 'text',
		id,
		name,
		value = '',
		placeholder,
		min,
		max,
		append,
		isInvalid,
		isDisabled,
		isReadonly,
		onChange,
		...restProps
	} = props;

	const cn = clsx(
		'flex h-10 w-full items-center gap-2 rounded-md border bg-white px-3 text-sm text-foreground transition-colors',
		'focus-within:ring-2',
		isInvalid ? 'border-red-500 focus-within:ring-red-500/20' : 'border-zinc-300 focus-within:border-green focus-within:ring-green/20',
		isDisabled && 'cursor-not-allowed opacity-50',
		className
	);

	return (
		<div ref={ref} className={cn} {...restProps}>
			<input
				className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
				type={type}
				id={id}
				name={name}
				value={value === null ? '' : value}
				placeholder={placeholder}
				min={min}
				max={max}
				onChange={(e) => onChange && onChange(e.target.value)}
				disabled={isDisabled}
				readOnly={isReadonly || !onChange}
				aria-invalid={isInvalid || undefined}
			/>

			{!!append && (
				<div className="flex shrink-0 items-center text-zinc-500" onMouseDown={(e) => e.preventDefault()}>
					{append}
				</div>
			)}
		</div>
	);
};

Input.displayName = 'Input';

export { Input };
