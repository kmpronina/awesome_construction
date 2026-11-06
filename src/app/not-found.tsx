import type { Metadata } from 'next';

/* Views */
import { NotFoundPage } from '@/components/views/NotFoundPage';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Not Found'
	};
}

const NotFound = () => {
	return <NotFoundPage />;
};

export default NotFound;
