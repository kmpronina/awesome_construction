import React from 'react';
import { clsx } from 'clsx';

interface LabelFieldProps {
	className?: string;
	children: React.ReactNode;
	id?: string;
	isDisabled?: boolean;
	onClick?: () => void;
}

const LabelField = (props: LabelFieldProps) => {
	const { className, children, id, isDisabled, onClick } = props;

	const cn = clsx(
		'mb-1.5 flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 select-none',
		isDisabled && 'cursor-not-allowed text-zinc-400',
		className
	);

	return (
		<label className={cn} htmlFor={id} onClick={onClick}>
			{children}
		</label>
	);
};

LabelField.displayName = 'LabelField';

export { LabelField };
