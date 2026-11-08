/* Types */
import type { TaskHistoryItem } from '@/types';

/* Utils */
import { dateTimeFormatter, getUserLabel } from '@/utils/helpers';

interface TaskHistoryProps {
	items: TaskHistoryItem[];
}

// The first record has no previous status: it is the task creation
const getChangeLabel = (item: TaskHistoryItem) => {
	const to = item.toStatusInfo?.label ?? item.to_status;

	if (!item.from_status) return `Создана со статусом «${to}»`;

	const from = item.fromStatusInfo?.label ?? item.from_status;

	return `${from} → ${to}`;
};

const TaskHistory = (props: TaskHistoryProps) => {
	const { items } = props;

	return (
		<section className="flex flex-col gap-4">
			<h2 className="text-lg font-semibold text-green">История</h2>

			{items.length > 0 ? (
				<ol className="flex flex-col gap-3">
					{items.map((item) => (
						<li key={item.id} className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4">
							<p className="text-sm font-medium text-zinc-700">{getChangeLabel(item)}</p>

							<p className="text-xs text-zinc-400">
								{getUserLabel(item.editor)} · <time dateTime={item.created_at}>{dateTimeFormatter.format(new Date(item.created_at))}</time>
							</p>

							{!!item.comment && <p className="mt-1 border-l-2 border-zinc-200 pl-3 text-sm whitespace-pre-line text-zinc-600">{item.comment}</p>}
						</li>
					))}
				</ol>
			) : (
				<p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">История пока пуста</p>
			)}
		</section>
	);
};

export default TaskHistory;
