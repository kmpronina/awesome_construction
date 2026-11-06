import { permanentRedirect } from 'next/navigation';

const Home = () => {
	permanentRedirect('/constructions');
};

export default Home;
