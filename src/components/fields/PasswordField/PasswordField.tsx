'use client';

import React from 'react';

/* Fields */
import { InputField, type InputFieldProps } from '@/components/fields/InputField';

type PasswordFieldProps = Omit<InputFieldProps, 'type' | 'append'>;

/* Icons */
const iconProps = {
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	className: 'size-5',
	'aria-hidden': true
} as const;

const EyeIcon = () => (
	<svg {...iconProps}>
		<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
		<circle cx="12" cy="12" r="3" />
	</svg>
);

const EyeOffIcon = () => (
	<svg {...iconProps}>
		<path d="M10.7 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.1" />
		<path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
		<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
		<path d="m2 2 20 20" />
	</svg>
);

const PasswordField = (props: PasswordFieldProps) => {
	const [show, setShow] = React.useState(false);

	const append = (
		<button
			type="button"
			className="flex cursor-pointer items-center text-zinc-500 transition-colors hover:text-zinc-800"
			aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
			onClick={() => setShow(!show)}
		>
			{show ? <EyeOffIcon /> : <EyeIcon />}
		</button>
	);

	return <InputField type={show ? 'text' : 'password'} append={append} {...props} />;
};

PasswordField.displayName = 'PasswordField';

export { PasswordField };
