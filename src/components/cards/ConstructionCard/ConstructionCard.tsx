import Link from 'next/link';

/* Types */
import { ConstructionItem } from '@/types';

/* Utils */
import { dateFormatter } from '@/utils/helpers';

interface ConstructionCardProps {
	item: ConstructionItem;
}

const ConstructionCard = (props: ConstructionCardProps) => {
	const { item } = props;

	return (
		<Link
			href={`/constructions/${item.id}`}
			className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
		>
			<h3 className="truncate text-base font-semibold text-green">{item.title}</h3>

			<p className="truncate text-sm text-zinc-600">{item.address}</p>

			<time dateTime={item.created_at} className="mt-2 text-xs text-zinc-400">
				{dateFormatter.format(new Date(item.created_at))}
			</time>
		</Link>
	);
};

export { ConstructionCard };
