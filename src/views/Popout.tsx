// import PlayerViewPanel from '@/components/player-view-panel';
import { useSearchParams } from 'react-router';

function PopoutView() {
	const [params] = useSearchParams();

	if (params.get('local') !== null) {
		return (
			// <RoomProvider port={port}>
			<PlayerViewPanel />
			// </RoomProvider>
		);
	} else {
		return <PlayerViewPanel />;
	}
}

export default PopoutView;

function PlayerViewPanel() {
	return <div>Player View Panel (TODO)</div>;
}
