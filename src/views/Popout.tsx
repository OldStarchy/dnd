import PlayerViewPanel from '@/components/player-view-panel';
import { store } from '@/store/store';
import { Provider } from 'react-redux';

function PopoutView() {
	return (
		<Provider store={store}>
			<PlayerViewPanel />
		</Provider>
	);
}

export default PopoutView;
