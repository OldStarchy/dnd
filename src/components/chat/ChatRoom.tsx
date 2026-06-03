import { useEffect, useReducer, useRef, useState, type SubmitEventHandler } from 'react';
import { chatReducer, createInitialChatState } from '../../features/chat/chatState';
import type { ChatClient, ChatSnapshot } from '../../features/chat/chatTypes';
import { getOrCreateTabName } from '../../features/chat/tabIdentity';

export default function ChatRoom({
	clientFactory,
}: {
	clientFactory: (name: string, onUpdate: (snapshot: ChatSnapshot) => void) => Promise<ChatClient>;
}) {
	const [state, dispatch] = useReducer(chatReducer, getOrCreateTabName(), createInitialChatState);

	const tabName = useRef(state.tabName);
	tabName.current = state.tabName;

	const [client, setClient] = useState<ChatClient | null>(null);

	useEffect(() => {
		const abort = new AbortController();
		const { signal } = abort;

		void (async () => {
			try {
				dispatch({ type: 'connect:start' });

				await new Promise<void>((resolve) => queueMicrotask(resolve));
				if (signal.aborted) return;

				const client = await clientFactory(tabName.current, (snapshot) => {
					if (signal.aborted) return;

					dispatch({ type: 'snapshot:received', snapshot });
				});

				if (signal.aborted) {
					client[Symbol.dispose]();
					return;
				}

				window.addEventListener(
					'beforeunload',
					() => {
						dispatch({ type: 'disconnect' });
						client[Symbol.dispose]();
					},
					{ signal },
				);

				signal.addEventListener('abort', () => {
					client[Symbol.dispose]();
				});

				setClient(client);
				dispatch({ type: 'connect:success' });
			} catch (error) {
				console.error('Failed to initialize chat client:', error);
				dispatch({ type: 'connect:unsupported' });
			}
		})();

		return () => abort.abort();
	}, []);

	const statusLabel =
		state.status === 'connected'
			? 'Connected'
			: state.status === 'connecting'
				? 'Connecting...'
				: state.status === 'unsupported'
					? 'Shared worker unavailable'
					: 'Idle';

	const onSend: SubmitEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();
		if (!state.draft.trim() || state.status !== 'connected') {
			return;
		}
		if (!client) throw new Error('Chat client is not initialized');
		client.send(state.draft);
		dispatch({ type: 'message:sent' });
	};

	return (
		<section className="chat-room" aria-label="Shared worker chat room">
			<header className="chat-room__header">
				<h1>Local Shared Worker Chat</h1>
				<p>
					<span>Tab:</span> <strong>{state.tabName}</strong>
				</p>
				<p className="chat-room__status" data-status={state.status}>
					{statusLabel}
				</p>
			</header>

			<section className="chat-room__panel" aria-label="Participants">
				<h2>Participants ({state.participants.length})</h2>
				<ul>
					{state.participants.map((participant) => (
						<li key={participant}>{participant}</li>
					))}
					{state.participants.length === 0 ? <li>No participants yet</li> : null}
				</ul>
			</section>

			<section className="chat-room__panel" aria-label="Messages">
				<h2>Messages</h2>
				<ol className="chat-room__messages">
					{state.messages.map((message) => (
						<li key={message.id} data-kind={message.kind}>
							{message.kind === 'system' ? (
								<em>{message.text}</em>
							) : (
								<>
									<strong>{message.author}</strong>
									<span>{message.text}</span>
								</>
							)}
						</li>
					))}
					{state.messages.length === 0 ? <li data-kind="system">No messages yet</li> : null}
				</ol>
			</section>

			<form className="chat-room__composer" onSubmit={onSend}>
				<label htmlFor="chat-message">Message</label>
				<input
					id="chat-message"
					name="message"
					type="text"
					value={state.draft}
					onChange={(event) => dispatch({ type: 'draft:update', value: event.currentTarget.value })}
					placeholder="Type a message"
					autoComplete="off"
				/>
				<button type="submit" disabled={state.status !== 'connected' || !state.draft.trim()}>
					Send
				</button>
			</form>
		</section>
	);
}
