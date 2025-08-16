import { MessagePortTransportProvider } from '@/components/context/MessagePortTransportProvider';
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
		return <PlayerViewPanel />;
	}
}

export default PopoutView;
