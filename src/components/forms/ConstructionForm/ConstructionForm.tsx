'use client';

import Link from 'next/link';
import clsx from 'clsx';
import * as yup from 'yup';

/* Types */
import { ConstructionFields } from '@/types';

/* Actions */
import { createConstruction } from '@/actions/constructions';

/* UI */
import { toast } from '@/components/ui/Toaster';

/* Fields */
import { FormikHelpers, FormWrapper } from '@/components/fields/FormWrapper';
import { InputField } from '@/components/fields/InputField';
import { SubmitButton } from '@/components/fields/SubmitButton';

interface ConstructionFormProps {
	className?: string;
}

const constructionFormFields: ConstructionFields = {
	title: '',
	address: ''
};

const constructionFormSchema = yup.object().shape({
	title: yup.string().trim().required('Title is a required field'),
	address: yup.string().trim().required('Address is a required field')
});

const ConstructionForm = (props: ConstructionFormProps) => {
	const { className } = props;

	// On success the Server Function redirects to the new construction, so only errors come back
	const handleFormSubmit = async (data: ConstructionFields, { setSubmitting }: FormikHelpers<ConstructionFields>) => {
		const result = await createConstruction(data);

		if (result?.error) {
			toast.error(result.error);
			setSubmitting(false);
		}
	};

	const cn = clsx('flex w-full max-w-lg flex-col gap-5 rounded-xl bg-white p-6 shadow-sm', className);

	return (
		<FormWrapper fields={constructionFormFields} schema={constructionFormSchema} onSubmit={handleFormSubmit} className={cn}>
			<h1 className="text-2xl font-bold text-green">New construction</h1>

			<InputField id="title" name="title" label="Title" placeholder="Title" className="w-full" />
			<InputField id="address" name="address" label="Address" placeholder="Address" className="w-full" />

			<div className="flex items-center justify-end gap-3">
				<Link href="/constructions" className="text-sm text-zinc-500 transition-colors hover:text-green">
					Cancel
				</Link>

				<SubmitButton>Create</SubmitButton>
			</div>
		</FormWrapper>
	);
};

export { ConstructionForm };
