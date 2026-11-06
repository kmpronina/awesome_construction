import React from 'react';

/* Primitives */
import { Slot } from '@radix-ui/react-slot';

/* UI */
import { Spinner } from '@/components/ui/Spinner';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
	ref?: React.RefObject<HTMLButtonElement>;
	asChild?: boolean;
	isLoading?: boolean;
	isDisabled?: boolean;
}

const Button = (props: ButtonProps) => {
	const { ref, asChild, className = '', children, isLoading, isDisabled, ...restProps } = props;

	const Component = asChild ? Slot : 'button';

	const cn = `inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-green px-4 text-sm font-medium text-light transition-colors hover:bg-green/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

	return (
		<Component ref={ref} className={cn} disabled={isLoading || isDisabled} {...restProps}>
			{isLoading ? <Spinner size="md" /> : children}
		</Component>
	);
};

Button.displayName = 'Button';

export { Button };
