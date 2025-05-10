import { store } from '@/store/store';
import { Provider } from 'react-redux';
import App from '../components/App';

function Home() {
	return (
		<Provider store={store}>
			<App />
		</Provider>
	);
}

export default Home;
