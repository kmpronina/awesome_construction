const ListSkeleton = () => {
	return (
		<div className="flex flex-col gap-2">
			<div className="h-5 w-48 animate-pulse rounded bg-zinc-200" />
			<div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
			<div className="h-5 w-52 animate-pulse rounded bg-zinc-200" />
		</div>
	);
};

export { ListSkeleton };
