import { MessagePortTransportProvider } from '@/components/context/MessagePortTransportProvider';
import { WebSocketTransportProvider } from '@/components/context/WebSocketTransportProvider';
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
			<WebSocketTransportProvider>
				<PlayerViewPanel />
			</WebSocketTransportProvider>
		);
	}
}

export default PopoutView;
