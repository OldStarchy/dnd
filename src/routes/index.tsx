/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router';
import ChatRoom from '../components/chat/ChatRoom';
import { SharedWorkerChatClient } from '../features/chat/sharedWorkerChatClient';

interface Search {
	mode?: 'gm' | 'player';
}
export const Route = createFileRoute('/')({
	component: Page,
	validateSearch(search: Search): Search {
		if (['gm', 'player'].includes(search.mode ?? '')) {
			return { mode: search.mode };
		}
		return { mode: undefined };
	},
});

const clientFactory = SharedWorkerChatClient.create;

function Page() {
	const query = Route.useSearch();
	const mode = query.mode;

	return (
		<div className="page-home">
			{mode ? <p className="page-home__mode">Mode: {mode}</p> : null}
			<ChatRoom clientFactory={clientFactory} />
		</div>
	);
}

export default Page;
