import type { Metadata } from 'next';

/* Views */
import { NotFoundPage } from '@/components/views/NotFoundPage';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Страница не найдена'
	};
}

const NotFound = () => {
	return <NotFoundPage />;
};

export default NotFound;
