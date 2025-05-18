import PlayerViewPanel from '@/components/player-view-panel';
import { reducedStore } from '@/store/reduced-store';
import { Provider } from 'react-redux';

function PopoutView() {
	return (
		<Provider store={reducedStore}>
			<PlayerViewPanel />
		</Provider>
	);
}

export default PopoutView;
