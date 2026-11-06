'use client';

import type { Metadata } from 'next';

/* Views */
import { ErrorPage } from '@/components/views/ErrorPage';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Error'
	};
}

const Error = () => {
	return <ErrorPage />;
};

export default Error;
