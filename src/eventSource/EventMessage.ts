import type { BaseEvent } from './BaseEvent';

export type EventMessage<EventPayload> =
	| {
			type: 'event';
			event: BaseEvent<EventPayload>;
	  }
	| {
			type: 'proposeEvent';
			id: string;
			payload: EventPayload;
	  }
	| {
			type: 'rejection';
			eventId: string;
	  }
	| {
			type: 'requestHistory';
			since: number;
	  }
	| {
			type: 'eventHistory';
			events: BaseEvent<EventPayload>[];
	  };
