/// <reference lib="webworker" />

declare const self: SharedWorkerGlobalScope;

interface ChatMessage {
	id: string;
	author: string;
	text: string;
	kind: 'message' | 'system';
	createdAt: number;
}

interface ChatSnapshot {
	participants: string[];
	messages: ChatMessage[];
}

interface ChatUpdateMessage {
	type: 'chat:update';
	reason: string;
	payload: ChatSnapshot;
}

interface ChatJoinMessage {
	type: 'chat:join';
	name: string;
}

interface ChatLeaveMessage {
	type: 'chat:leave';
	name: string;
}

interface ChatSendMessage {
	type: 'chat:send';
	author: string;
	text: string;
}

interface ChatSyncRequestMessage {
	type: 'chat:sync-request';
}

type IncomingChatMessage =
	| ChatJoinMessage
	| ChatLeaveMessage
	| ChatSendMessage
	| ChatSyncRequestMessage;

const chatState: {
	participants: Set<string>;
	messages: ChatMessage[];
} = {
	participants: new Set(),
	messages: [],
};

const messageLimit = 100;
const ports = new Set<MessagePort>();

function isIncomingChatMessage(value: unknown): value is IncomingChatMessage {
	if (!value || typeof value !== 'object' || !('type' in value)) {
		return false;
	}

	return ['chat:join', 'chat:leave', 'chat:send', 'chat:sync-request'].includes(String(value.type));
}

function makeChatMessage(
	author: string,
	text: string,
	kind: ChatMessage['kind'] = 'message',
): ChatMessage {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		author,
		text,
		kind,
		createdAt: Date.now(),
	};
}

function normalizeMessage(text: string): string {
	return text.trim().replace(/\s+/g, ' ');
}

function getSnapshot(): ChatSnapshot {
	return {
		participants: [...chatState.participants].sort((left, right) => left.localeCompare(right)),
		messages: [...chatState.messages],
	};
}

function postToPort(port: MessagePort, reason: string): void {
	port.postMessage({
		type: 'chat:update',
		reason,
		payload: getSnapshot(),
	} satisfies ChatUpdateMessage);
}

function broadcastState(reason: string, sourcePort?: MessagePort): void {
	console.log(`Broadcasting state update due to: ${reason}`);
	for (const port of ports) {
		if (sourcePort && port === sourcePort) {
			continue;
		}
		postToPort(port, reason);
	}
}

function pushMessage(message: ChatMessage): void {
	chatState.messages.push(message);
	if (chatState.messages.length > messageLimit) {
		chatState.messages.splice(0, chatState.messages.length - messageLimit);
	}
}

function handleMessage(data: IncomingChatMessage, sourcePort: MessagePort): void {
	console.log('Received message from port:', data);
	if (data.type === 'chat:join') {
		const name = data.name.trim();
		if (!name) {
			return;
		}
		if (!chatState.participants.has(name)) {
			chatState.participants.add(name);
			pushMessage(makeChatMessage('system', `${name} joined the room`, 'system'));
		}
		broadcastState('join');
		return;
	}

	if (data.type === 'chat:leave') {
		const name = data.name.trim();
		if (!name) {
			return;
		}
		if (chatState.participants.delete(name)) {
			pushMessage(makeChatMessage('system', `${name} left the room`, 'system'));
			broadcastState('leave');
		}
		return;
	}

	if (data.type === 'chat:send') {
		const author = data.author.trim();
		const normalizedText = normalizeMessage(data.text);
		if (!author || !normalizedText) {
			return;
		}
		pushMessage(makeChatMessage(author, normalizedText));
		broadcastState('message');
		return;
	}

	postToPort(sourcePort, 'sync');
}

self.addEventListener('connect', (event: MessageEvent) => {
	const [port] = event.ports;
	if (!port) {
		return;
	}

	ports.add(port);
	port.start();

	port.addEventListener('message', (messageEvent: MessageEvent<unknown>) => {
		if (!isIncomingChatMessage(messageEvent.data)) {
			return;
		}
		handleMessage(messageEvent.data, port);
	});

	port.addEventListener('messageerror', () => {
		ports.delete(port);
	});
});

export {};
