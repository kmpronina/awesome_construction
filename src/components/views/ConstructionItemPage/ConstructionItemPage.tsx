import Link from 'next/link';

/* Types */
import { ConstructionItem, TaskListItem } from '@/types';

/* Utils */
import { dateFormatter } from '@/utils/helpers';

/* Cards */
import { TaskCard } from '@/components/cards/TaskCard';

interface ConstructionItemPageProps {
	item: ConstructionItem;
	tasks: TaskListItem[];
}

const ConstructionItemPage = (props: ConstructionItemPageProps) => {
	const { item, tasks } = props;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<Link href="/constructions" className="w-fit text-sm text-zinc-500 transition-colors hover:text-green">
					← All constructions
				</Link>

				<h1 className="text-2xl font-bold text-green sm:text-3xl">{item.title}</h1>

				<p className="text-zinc-600">{item.address}</p>

				<p className="text-sm text-zinc-400">
					Created <time dateTime={item.created_at}>{dateFormatter.format(new Date(item.created_at))}</time>
				</p>
			</div>

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold text-green">
					Tasks <span className="font-normal text-zinc-400">({tasks.length})</span>
				</h2>

				{tasks.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{tasks.map((task) => (
							<TaskCard key={task.id} item={task} />
						))}
					</div>
				) : (
					<p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">No tasks yet</p>
				)}
			</section>
		</div>
	);
};

export { ConstructionItemPage };
