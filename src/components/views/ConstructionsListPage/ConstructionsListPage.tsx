/* Types */
import { ConstructionItem } from '@/types';

/* Cards */
import { ConstructionCard } from '@/components/cards/ConstructionCard';

interface ConstructionsPageProps {
	items: ConstructionItem[];
}
const ConstructionsListPage = (props: ConstructionsPageProps) => {
	const { items } = props;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item) => (
				<ConstructionCard key={item.id} item={item} />
			))}
		</div>
	);
};

export { ConstructionsListPage };
