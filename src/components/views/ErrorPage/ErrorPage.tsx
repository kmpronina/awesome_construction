import Link from 'next/link';

/* UI */
import { Button } from '@/components/ui/Button';

const ErrorPage = () => {
	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 bg-light px-4 text-center">
			<h1 className="text-7xl font-bold tracking-wide text-green sm:text-8xl">Что-то пошло не так</h1>

			<Button asChild className="mt-2">
				<Link href="/constructions">На главную</Link>
			</Button>
		</div>
	);
};

export { ErrorPage };
