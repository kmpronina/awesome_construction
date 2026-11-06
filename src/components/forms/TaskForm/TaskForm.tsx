'use client';

import Link from 'next/link';
import clsx from 'clsx';
import * as yup from 'yup';

/* Types */
import type { ConstructionItem, SelectItem, TaskFields, TaskItem, UserItem } from '@/types';

/* Actions */
import { createTask, updateTask } from '@/actions/tasks';

/* UI */
import { toast } from '@/components/ui/Toaster';

/* Fields */
import { FormikHelpers, FormWrapper } from '@/components/fields/FormWrapper';
import { InputField } from '@/components/fields/InputField';
import { SelectField } from '@/components/fields/SelectField';
import { SubmitButton } from '@/components/fields/SubmitButton';

interface TaskFormProps {
	className?: string;
	// Passed for editing; without it the form creates a new task
	item?: TaskItem;
	executors: UserItem[];
	constructions: ConstructionItem[];
}

const taskFormSchema = yup.object().shape({
	title: yup.string().trim().required('Title is a required field'),
	description: yup.string().trim().required('Description is a required field'),
	construction: yup.object().nullable().required('Construction is a required field'),
	executor: yup.object().nullable().required('Executor is a required field')
});

const TaskForm = (props: TaskFormProps) => {
	const { className, item, executors, constructions } = props;

	const isEdit = !!item;

	const constructionItems: SelectItem[] = constructions.map((construction, index) => ({ id: index, label: construction.title, value: construction.id }));
	const executorItems: SelectItem[] = executors.map((executor, index) => ({ id: index, label: executor.name || executor.email, value: executor.id }));

	const taskFormFields: TaskFields = {
		title: item?.title ?? '',
		description: item?.description ?? '',
		construction: constructionItems.find((option) => option.value === item?.construction_id) ?? null,
		executor: executorItems.find((option) => option.value === item?.executor_id) ?? null
	};

	// On success the Server Functions redirect, so only errors come back
	const handleFormSubmit = async (data: TaskFields, { setSubmitting }: FormikHelpers<TaskFields>) => {
		if (item) {
			const result = await updateTask(item.id, { title: data.title, description: data.description });

			if (result?.error) {
				toast.error(result.error);
				setSubmitting(false);
			}

			return;
		}

		if (!data.construction || !data.executor) {
			toast.error('Construction and Executor are required fields');
			setSubmitting(false);

			return;
		}

		const result = await createTask({
			title: data.title,
			description: data.description,
			construction_id: data.construction.value,
			executor_id: data.executor.value
		});

		if (result?.error) {
			toast.error(result.error);
			setSubmitting(false);
		}
	};

	const cn = clsx('flex w-full max-w-lg flex-col gap-5 rounded-xl bg-white p-6 shadow-sm', className);

	return (
		<FormWrapper fields={taskFormFields} schema={taskFormSchema} onSubmit={handleFormSubmit} className={cn}>
			<h1 className="text-2xl font-bold text-green">{isEdit ? 'Edit task' : 'New task'}</h1>

			<InputField id="title" name="title" label="Title" placeholder="Title" className="w-full" />
			<InputField id="description" name="description" label="Description" placeholder="Description" className="w-full" />

			{/* Construction and executor are set once when the task is created */}
			<SelectField
				id="construction"
				name="construction"
				label="Construction"
				placeholder="Select construction"
				items={constructionItems}
				description={isEdit ? 'Cannot be changed after creation' : undefined}
				isDisabled={isEdit}
				className="w-full"
			/>

			<SelectField
				id="executor"
				name="executor"
				label="Executor"
				placeholder="Select executor"
				items={executorItems}
				description={isEdit ? 'Cannot be changed after creation' : undefined}
				isDisabled={isEdit}
				className="w-full"
			/>

			<div className="flex items-center justify-end gap-3">
				<Link href={isEdit ? `/tasks/${item.id}` : '/constructions'} className="text-sm text-zinc-500 transition-colors hover:text-green">
					Cancel
				</Link>

				<SubmitButton isChangeRequired={isEdit}>{isEdit ? 'Save' : 'Create'}</SubmitButton>
			</div>
		</FormWrapper>
	);
};

export { TaskForm };
