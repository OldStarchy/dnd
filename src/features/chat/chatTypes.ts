export interface ChatMessage {
	id: string;
	author: string;
	text: string;
	kind: 'message' | 'system';
	createdAt: number;
}

export interface ChatSnapshot {
	participants: string[];
	messages: ChatMessage[];
}

export interface ChatUpdateMessage {
	type: 'chat:update';
	reason: string;
	payload: ChatSnapshot;
}

export interface ChatClient extends Disposable {
	readonly id: string;
	send(text: string): void;
}
