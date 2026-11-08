import Link from 'next/link';

/* Types */
import { ConstructionItem, TaskListItem } from '@/types';

/* Actions */
import { deleteConstruction } from '@/actions/constructions';

/* Utils */
import { dateFormatter } from '@/utils/helpers';

/* UI */
import { Button } from '@/components/ui/Button';
import { DeleteButton } from '@/components/ui/DeleteButton';

/* Cards */
import { TaskCard } from '@/components/cards/TaskCard';

interface ConstructionItemPageProps {
	item: ConstructionItem;
	tasks: TaskListItem[];
	// Shows the edit link and the delete button
	canEdit: boolean;
}

const ConstructionItemPage = (props: ConstructionItemPageProps) => {
	const { item, tasks, canEdit } = props;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<Link href="/constructions" className="w-fit text-sm text-zinc-500 transition-colors hover:text-green">
					← Все объекты
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<h1 className="min-w-0 text-2xl font-bold break-words text-green sm:text-3xl">{item.title}</h1>

					{canEdit && (
						<div className="flex shrink-0 items-center gap-3">
							<Button asChild>
								<Link href={`/constructions/${item.id}/edit`}>Изменить</Link>
							</Button>

							<DeleteButton onDelete={deleteConstruction.bind(null, item.id)} />
						</div>
					)}
				</div>

				<p className="text-zinc-600">{item.address}</p>

				<p className="text-sm text-zinc-400">
					Создан <time dateTime={item.created_at}>{dateFormatter.format(new Date(item.created_at))}</time>
				</p>
			</div>

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold text-green">
					Задачи <span className="font-normal text-zinc-400">({tasks.length})</span>
				</h2>

				{tasks.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{tasks.map((task) => (
							<TaskCard key={task.id} item={task} />
						))}
					</div>
				) : (
					<p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">Задач пока нет</p>
				)}
			</section>
		</div>
	);
};

export { ConstructionItemPage };
