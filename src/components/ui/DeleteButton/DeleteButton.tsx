'use client';

import React from 'react';

/* UI */
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toaster';

interface DeleteButtonProps {
	// A Server Function with its arguments bound; on success it redirects, so only an error comes back
	onDelete: () => Promise<{ error: string } | null | undefined>;
}

// Deleting cannot be undone, so the first click asks for confirmation right in place
const DeleteButton = (props: DeleteButtonProps) => {
	const { onDelete } = props;

	const [isConfirming, setIsConfirming] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);

		const result = await onDelete();

		if (result?.error) {
			toast.error(result.error);
			setIsDeleting(false);
			setIsConfirming(false);
		}
	};

	if (!isConfirming) {
		return (
			<Button type="button" onClick={() => setIsConfirming(true)}>
				Удалить
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Button type="button" isLoading={isDeleting} onClick={handleDelete}>
				Подтвердить удаление
			</Button>

			<button
				type="button"
				className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-green disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isDeleting}
				onClick={() => setIsConfirming(false)}
			>
				Отмена
			</button>
		</div>
	);
};

export { DeleteButton };
