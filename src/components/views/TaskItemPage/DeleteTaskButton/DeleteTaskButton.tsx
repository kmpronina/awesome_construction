'use client';

import React from 'react';

/* Actions */
import { deleteTask } from '@/actions/tasks';

/* UI */
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toaster';

interface DeleteTaskButtonProps {
	taskId: string;
	constructionId: string;
}

// Deleting cannot be undone, so the first click asks for confirmation right in place
const DeleteTaskButton = (props: DeleteTaskButtonProps) => {
	const { taskId, constructionId } = props;

	const [isConfirming, setIsConfirming] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	// On success the Server Function redirects to the construction page, so only errors come back
	const handleDelete = async () => {
		setIsDeleting(true);

		const result = await deleteTask(taskId, constructionId);

		if (result?.error) {
			toast.error(result.error);
			setIsDeleting(false);
			setIsConfirming(false);
		}
	};

	if (!isConfirming) {
		return (
			<Button type="button" onClick={() => setIsConfirming(true)}>
				Delete
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Button type="button" isLoading={isDeleting} onClick={handleDelete}>
				Confirm delete
			</Button>

			<button
				type="button"
				className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-green disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isDeleting}
				onClick={() => setIsConfirming(false)}
			>
				Cancel
			</button>
		</div>
	);
};

export default DeleteTaskButton;
