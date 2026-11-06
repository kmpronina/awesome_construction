import Link from 'next/link';

/* Types */
import { TaskListItem } from '@/types';

/* Utils */
import { dateFormatter } from '@/utils/helpers';

interface TaskCardProps {
	item: TaskListItem;
}

const TaskCard = (props: TaskCardProps) => {
	const { item } = props;

	return (
		<Link
			href={`/tasks/${item.id}`}
			className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
		>
			<div className="flex items-start justify-between gap-3">
				<h3 className="min-w-0 truncate text-base font-semibold text-green">{item.title}</h3>

				<span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{item.statusInfo?.label ?? item.status}</span>
			</div>

			<p className="line-clamp-2 text-sm text-zinc-600">{item.description}</p>

			<time dateTime={item.created_at} className="mt-2 text-xs text-zinc-400">
				{dateFormatter.format(new Date(item.created_at))}
			</time>
		</Link>
	);
};

export { TaskCard };
