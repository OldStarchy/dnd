import { PopoutProvider } from '@/components/PopoutProvider';
import { primaryStore } from '@/store/primary-store';
import { Provider } from 'react-redux';
import GameMasterControlPanel from '../components/game-master-control-panel';

function Home() {
	return (
		<Provider store={primaryStore}>
			<PopoutProvider>
				<GameMasterControlPanel />
			</PopoutProvider>
		</Provider>
	);
}

export default Home;
