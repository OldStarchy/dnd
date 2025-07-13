import { MessagePortTransportProvider } from '@/components/context/MessagePortTransportProvider';
import { WebsocketTransportProvider } from '@/components/context/WebsocketTransportProvider';
import PlayerViewPanel from '@/components/player-view-panel';
import { useSearchParams } from 'react-router';

function PopoutView() {
	const [params] = useSearchParams();

	if (params.get('local') !== null) {
		return (
			<MessagePortTransportProvider>
				<PlayerViewPanel />
			</MessagePortTransportProvider>
		);
	} else {
		return (
			<WebsocketTransportProvider>
				<PlayerViewPanel />
			</WebsocketTransportProvider>
		);
	}
}

export default PopoutView;
