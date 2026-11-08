import type { Metadata } from 'next';

/* Views */
import { LoginPage } from '@/components/views/LoginPage';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Вход'
	};
}
const LogIn = () => {
	return <LoginPage />;
};

export default LogIn;
