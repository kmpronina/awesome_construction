import React from 'react';

type SpinnerSizes = 'md' | 'xl' | null;

export interface SpinnerProps {
	ref?: React.RefObject<HTMLDivElement>;
	className?: string;
	size?: SpinnerSizes;
}

const SIZES: Record<NonNullable<SpinnerSizes>, string> = {
	md: 'size-5 border-2',
	xl: 'size-12 border-[6px]'
};

const Spinner = (props: SpinnerProps) => {
	const { ref, className = '', size = 'md', ...restProps } = props;

	const cn = `animate-spin rounded-full border-solid border-current border-b-transparent ${size ? SIZES[size] : ''} ${className}`;

	return <div ref={ref} role="status" aria-label="Загрузка" className={cn} {...restProps}></div>;
};

Spinner.displayName = 'Spinner';

export { Spinner };
