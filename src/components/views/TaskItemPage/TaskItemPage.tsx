import Link from 'next/link';

/* Types */
import type { TaskDetailsItem, TaskHistoryItem, TransitionItem } from '@/types';

/* Utils */
import { dateFormatter, getUserLabel } from '@/utils/helpers';

/* UI */
import { Button } from '@/components/ui/Button';

/* Forms */
import { TaskStatusForm } from '@/components/forms/TaskStatusForm';

/* Local */
import TaskHistory from './TaskHistory/TaskHistory';

interface TaskItemPageProps {
	item: TaskDetailsItem;
	transitions: TransitionItem[];
	history: TaskHistoryItem[];
	// Shows the link to the edit page
	canEdit: boolean;
}

const TaskItemPage = (props: TaskItemPageProps) => {
	const { item, transitions, history, canEdit } = props;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				{item.construction && (
					<Link href={`/constructions/${item.construction.id}`} className="w-fit text-sm text-zinc-500 transition-colors hover:text-green">
						← {item.construction.title}
					</Link>
				)}

				<div className="flex flex-wrap items-start justify-between gap-3">
					<h1 className="min-w-0 text-2xl font-bold break-words text-green sm:text-3xl">{item.title}</h1>

					<div className="flex shrink-0 items-center gap-3">
						<span className="rounded-full bg-zinc-100 px-3 py-1 text-lg font-bold text-zinc-600">{item.statusInfo?.label ?? item.status}</span>

						{canEdit && (
							<Button asChild>
								<Link href={`/tasks/${item.id}/edit`}>Edit</Link>
							</Button>
						)}
					</div>
				</div>
			</div>

			<section className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold text-green">Description</h2>

				<p className="whitespace-pre-line text-zinc-600">{item.description}</p>
			</section>

			<dl className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2">
				<div className="flex flex-col gap-1">
					<dt className="text-xs text-zinc-400">Construction</dt>
					<dd className="text-sm text-zinc-700">{item.construction?.title ?? '—'}</dd>
				</div>

				<div className="flex flex-col gap-1">
					<dt className="text-xs text-zinc-400">Executor</dt>
					<dd className="text-sm text-zinc-700">{getUserLabel(item.executor)}</dd>
				</div>

				<div className="flex flex-col gap-1">
					<dt className="text-xs text-zinc-400">Author</dt>
					<dd className="text-sm text-zinc-700">{getUserLabel(item.author)}</dd>
				</div>

				<div className="flex flex-col gap-1">
					<dt className="text-xs text-zinc-400">Created</dt>
					<dd className="text-sm text-zinc-700">
						<time dateTime={item.created_at}>{dateFormatter.format(new Date(item.created_at))}</time>
					</dd>
				</div>
			</dl>

			{transitions.length > 0 && (
				<section className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold text-green">Change status</h2>

					<TaskStatusForm taskId={item.id} transitions={transitions} />
				</section>
			)}

			<TaskHistory items={history} />
		</div>
	);
};

export { TaskItemPage };
