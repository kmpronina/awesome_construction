'use client';

import React from 'react';
import clsx from 'clsx';
import { useFormikContext } from 'formik';

/* Types */
import type { TaskStatusFields, TransitionItem } from '@/types';

/* Actions */
import { changeTaskStatus } from '@/actions/tasks';

/* UI */
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toaster';

/* Fields */
import { FormikHelpers, FormWrapper } from '@/components/fields/FormWrapper';
import { InputField } from '@/components/fields/InputField';

interface TaskStatusFormProps {
	className?: string;
	taskId: string;
	transitions: TransitionItem[];
}

const taskStatusFormFields: TaskStatusFields = {
	comment: ''
};

interface TransitionButtonsProps {
	transitions: TransitionItem[];
	pendingStatus: string | null;
	onPick: (transition: TransitionItem) => void;
}

// Needs the Formik context, so it is rendered inside FormWrapper
const TransitionButtons = (props: TransitionButtonsProps) => {
	const { transitions, pendingStatus, onPick } = props;

	const { isSubmitting } = useFormikContext<TaskStatusFields>();

	return (
		<div className="flex flex-wrap gap-3">
			{transitions.map((transition) => (
				<Button
					key={transition.to_status}
					type="submit"
					isLoading={isSubmitting && pendingStatus === transition.to_status}
					isDisabled={isSubmitting}
					onClick={() => onPick(transition)}
				>
					{transition.action_label}
				</Button>
			))}
		</div>
	);
};

const TaskStatusForm = (props: TaskStatusFormProps) => {
	const { className, taskId, transitions } = props;

	// The clicked button sets the transition before the form submits.
	// A ref is read synchronously in onSubmit; state drives the spinner on that button
	const transitionRef = React.useRef<TransitionItem | null>(null);
	const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);

	const handlePick = (transition: TransitionItem) => {
		transitionRef.current = transition;
		setPendingStatus(transition.to_status);
	};

	const handleFormSubmit = async (data: TaskStatusFields, { setSubmitting, setFieldError, resetForm }: FormikHelpers<TaskStatusFields>) => {
		const transition = transitionRef.current;

		if (!transition) {
			setSubmitting(false);
			return;
		}

		// Same rule as in the database; checked here to show the error without a request
		if (transition.requires_comment && !data.comment.trim()) {
			setFieldError('comment', 'A comment is required for this action');
			setSubmitting(false);
			return;
		}

		const result = await changeTaskStatus(taskId, transition.to_status, data.comment);

		if (result?.error) {
			toast.error(result.error);
			setSubmitting(false);
			return;
		}

		toast.success('Status updated');
		resetForm();
	};

	if (transitions.length === 0) return null;

	// Tells which actions need a comment, e.g. "Required for: Return for rework"
	const requiredFor = transitions.filter((item) => item.requires_comment).map((item) => item.action_label);
	const commentHint = requiredFor.length > 0 ? `Required for: ${requiredFor.join(', ')}` : undefined;

	const cn = clsx('flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4', className);

	return (
		<FormWrapper fields={taskStatusFormFields} onSubmit={handleFormSubmit} className={cn}>
			<InputField id="comment" name="comment" label="Comment" placeholder="Comment" description={commentHint} className="w-full" />

			<TransitionButtons transitions={transitions} pendingStatus={pendingStatus} onPick={handlePick} />
		</FormWrapper>
	);
};

export { TaskStatusForm };
