const ItemSkeleton = () => {
	return (
		<div className="flex flex-col gap-3">
			<div className="h-8 w-72 animate-pulse rounded bg-zinc-200" />
			<div className="h-5 w-56 animate-pulse rounded bg-zinc-200" />
			<div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
		</div>
	);
};

export { ItemSkeleton };
