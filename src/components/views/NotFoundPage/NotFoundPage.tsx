import Link from 'next/link';

/* UI */
import { Button } from '@/components/ui/Button';

const NotFoundPage = () => {
	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 bg-light px-4 text-center">
			<h1 className="text-7xl font-bold tracking-wide text-green sm:text-8xl">404</h1>

			<p className="text-lg text-zinc-600">Page not Found</p>

			<Button asChild className="mt-2">
				<Link href="/constructions">Go to Home page</Link>
			</Button>
		</div>
	);
};

export { NotFoundPage };
