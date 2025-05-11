import { store } from '@/store/store';
import { Provider } from 'react-redux';
import GameMasterControlPanel from '../components/game-master-control-panel';

function Home() {
	return (
		<Provider store={store}>
			<GameMasterControlPanel />
		</Provider>
	);
}

export default Home;
