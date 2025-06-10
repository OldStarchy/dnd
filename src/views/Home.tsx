import { primaryStore } from '@/store/primary-store';
import { Provider } from 'react-redux';
import GameMasterControlPanel from '../components/game-master-control-panel';

function Home() {
	return (
		<Provider store={primaryStore}>
			<GameMasterControlPanel />
		</Provider>
	);
}

export default Home;
