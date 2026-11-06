'use client';

import clsx from 'clsx';
import * as yup from 'yup';

/* Types */
import type { LoginFields } from '@/types/stores/userStore';

/* UI */
import { toast } from '@/components/ui/Toaster';

/* Fields */
import { FormikHelpers, FormWrapper } from '@/components/fields/FormWrapper';
import { InputField } from '@/components/fields/InputField';
import { PasswordField } from '@/components/fields/PasswordField';
import { SubmitButton } from '@/components/fields/SubmitButton';

/* Stores */
import { useUserStore } from '@/stores';

interface LoginFormProps {
	className?: string;
}

const loginFormFields: LoginFields = {
	email: '',
	password: ''
};

const loginFormSchema = yup.object().shape({
	email: yup
		.string()
		.required('Email is a required field')
		.test('username-length', 'Enter a valid email', (value) => {
			if (!value) return false;
			const [username] = value.split('@');
			return username.length >= 1 && username.length <= 64;
		})
		.matches(/^(?!.*\.\.)(?!.*\.$)(?!^\.)[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9-]{1,253}\.[a-zA-Z]{2,13}(\.[a-zA-Z]{2,13})?$/, 'Enter a valid email'),
	password: yup
		.string()
		.required('Password is a required field')
		.min(8, 'Password must contain from 8 to 50 characters')
		.max(50, 'Password must contain from 8 to 50 characters')
});

const LoginForm = (props: LoginFormProps) => {
	const { className } = props;

	const [doLogin] = useUserStore((state) => [state.doLogin]);

	const handleFormSubmit = (data: LoginFields, { setSubmitting, setErrors }: FormikHelpers<LoginFields>) => {
		doLogin(data)
			.catch((errors) => {
				toast.error('Failed to authenticate user');
				const { message = null, ...restErrors } = errors;
				setErrors(restErrors);
			})
			.finally(() => {
				setSubmitting(false);
			});
	};

	const cn = clsx(
		'flex w-full max-w-sm flex-col gap-5 rounded-xl bg-white p-6 text-left text-base font-normal tracking-normal text-foreground shadow-lg',
		className
	);

	return (
		<FormWrapper fields={loginFormFields} schema={loginFormSchema} onSubmit={handleFormSubmit} className={cn}>
			<InputField id="email" name="email" type="email" label="Email" placeholder="Email" className="w-full" />
			<PasswordField id="password" name="password" label="Password" placeholder="Password" className="w-full" />

			<SubmitButton className="w-full">Login</SubmitButton>
		</FormWrapper>
	);
};

export { LoginForm };
