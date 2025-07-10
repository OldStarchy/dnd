import {
	MessagePortClientProvider,
	WebsocketClientProvider,
} from '@/components/ClientProvider';
import PlayerViewPanel from '@/components/player-view-panel';
import { useSearchParams } from 'react-router';

function PopoutView() {
	const [params] = useSearchParams();

	if (params.get('local') !== null) {
		return (
			<MessagePortClientProvider>
				<PlayerViewPanel />
			</MessagePortClientProvider>
		);
	} else {
		return (
			<WebsocketClientProvider>
				<PlayerViewPanel />
			</WebsocketClientProvider>
		);
	}
}

export default PopoutView;
