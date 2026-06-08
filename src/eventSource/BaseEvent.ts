export interface BaseEvent<Payload> {
	id: string;
	timestamp: number;
	source: { clientId: string };
	context?: Record<string, unknown>;
	payload: Payload;
}
