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
		.required('Укажите email')
		.test('username-length', 'Введите корректный email', (value) => {
			if (!value) return false;
			const [username] = value.split('@');
			return username.length >= 1 && username.length <= 64;
		})
		.matches(
			/^(?!.*\.\.)(?!.*\.$)(?!^\.)[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9-]{1,253}\.[a-zA-Z]{2,13}(\.[a-zA-Z]{2,13})?$/,
			'Введите корректный email'
		),
	password: yup
		.string()
		.required('Укажите пароль')
		.min(8, 'Пароль должен содержать от 8 до 50 символов')
		.max(50, 'Пароль должен содержать от 8 до 50 символов')
});

const LoginForm = (props: LoginFormProps) => {
	const { className } = props;

	const [doLogin] = useUserStore((state) => [state.doLogin]);

	const handleFormSubmit = (data: LoginFields, { setSubmitting, setErrors }: FormikHelpers<LoginFields>) => {
		doLogin(data)
			.catch((errors) => {
				toast.error('Не удалось войти. Проверьте email и пароль');
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
			<InputField id="email" name="email" type="email" label="Email" placeholder="name@example.com" className="w-full" />
			<PasswordField id="password" name="password" label="Пароль" placeholder="Пароль" className="w-full" />

			<SubmitButton className="w-full">Войти</SubmitButton>
		</FormWrapper>
	);
};

export { LoginForm };
