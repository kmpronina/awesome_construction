/* Types */
import { TaskListItem } from '@/types';

/* Cards */
import { TaskCard } from '@/components/cards/TaskCard';

interface TasksListPageProps {
	items: TaskListItem[];
}

const TasksListPage = (props: TasksListPageProps) => {
	const { items } = props;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item) => (
				<TaskCard key={item.id} item={item} />
			))}
		</div>
	);
};

export { TasksListPage };
