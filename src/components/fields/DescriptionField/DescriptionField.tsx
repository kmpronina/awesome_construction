import React from 'react';
import { clsx } from 'clsx';

interface DescriptionFieldProps {
	className?: string;
	children: React.ReactNode;
	isInvalid?: boolean;
}

const DescriptionField = (props: DescriptionFieldProps) => {
	const { className, children, isInvalid } = props;

	// Nothing to show: do not render an empty block that takes up space under the field
	if (!children) return null;

	const cn = clsx('mt-1 px-1 text-xs leading-4 transition-colors', isInvalid ? 'text-red-600' : 'text-zinc-500', className);

	return (
		<div className={cn} role={isInvalid ? 'alert' : undefined}>
			{children}
		</div>
	);
};

DescriptionField.displayName = 'DescriptionField';

export { DescriptionField };
