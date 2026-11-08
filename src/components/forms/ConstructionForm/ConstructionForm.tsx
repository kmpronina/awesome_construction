'use client';

import Link from 'next/link';
import clsx from 'clsx';
import * as yup from 'yup';

/* Types */
import type { ConstructionFields, ConstructionItem } from '@/types';

/* Actions */
import { createConstruction, updateConstruction } from '@/actions/constructions';

/* UI */
import { toast } from '@/components/ui/Toaster';

/* Fields */
import { FormikHelpers, FormWrapper } from '@/components/fields/FormWrapper';
import { InputField } from '@/components/fields/InputField';
import { SubmitButton } from '@/components/fields/SubmitButton';

interface ConstructionFormProps {
	className?: string;
	// Passed for editing; without it the form creates a new construction
	item?: ConstructionItem;
}

const constructionFormSchema = yup.object().shape({
	title: yup.string().trim().required('Укажите название'),
	address: yup.string().trim().required('Укажите адрес')
});

const ConstructionForm = (props: ConstructionFormProps) => {
	const { className, item } = props;

	const isEdit = !!item;

	const constructionFormFields: ConstructionFields = {
		title: item?.title ?? '',
		address: item?.address ?? ''
	};

	// On success the Server Functions redirect to the construction page, so only errors come back
	const handleFormSubmit = async (data: ConstructionFields, { setSubmitting }: FormikHelpers<ConstructionFields>) => {
		const result = item ? await updateConstruction(item.id, data) : await createConstruction(data);

		if (result?.error) {
			toast.error(result.error);
			setSubmitting(false);
		}
	};

	const cn = clsx('flex w-full max-w-lg flex-col gap-5 rounded-xl bg-white p-6 shadow-sm', className);

	return (
		<FormWrapper fields={constructionFormFields} schema={constructionFormSchema} onSubmit={handleFormSubmit} className={cn}>
			<h1 className="text-2xl font-bold text-green">{isEdit ? 'Редактирование объекта' : 'Новый объект'}</h1>

			<InputField id="title" name="title" label="Название" placeholder="Например, ЖК «Речной»" className="w-full" />
			<InputField id="address" name="address" label="Адрес" placeholder="Город, улица, дом" className="w-full" />

			<div className="flex items-center justify-end gap-3">
				<Link href={isEdit ? `/constructions/${item.id}` : '/constructions'} className="text-sm text-zinc-500 transition-colors hover:text-green">
					Отмена
				</Link>

				<SubmitButton isChangeRequired={isEdit}>{isEdit ? 'Сохранить' : 'Создать'}</SubmitButton>
			</div>
		</FormWrapper>
	);
};

export { ConstructionForm };
