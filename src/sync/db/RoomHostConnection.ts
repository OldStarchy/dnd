import type { ChangeSet } from '@/lib/changeSet';
import type { Creature } from '@/type/Creature';
import z from 'zod';
import { RemoteApi } from '../RemoteApi';
import type { TransportFactory } from '../Transport';

type DbMessageRequest<TName extends keyof Collections> =
	| {
			action: 'get';
			filter?: unknown;
	  }
	| {
			action: 'getOne';
			filter: unknown;
	  }
	| {
			action: 'create';
			data: Omit<Collections[TName], 'id' | 'revision'>;
	  }
	| {
			action: 'update';
			id: string;
			revision: number;
			changeSet: ChangeSet<Omit<Collections[TName], 'id' | 'revision'>>;
	  }
	| {
			action: 'delete';
			id: string;
			revision: number;
	  };

export type ClientToRoomHostRequest<TName extends keyof Collections> = {
	type: 'db';
	collection: TName;
} & DbMessageRequest<TName>;

type DbMessageResponse<TName extends keyof Collections> =
	| {
			action: 'get';
			data: Collections[TName][];
	  }
	| {
			action: 'getOne';
			data: Collections[TName] | null;
	  }
	| {
			action: 'create';
			data: Collections[TName];
	  };

export type RoomHostToClientResponse<TName extends keyof Collections> = {
	type: 'db';
	collection: TName;
} & DbMessageResponse<TName>;

type RoomHostToClientNotification<TName extends keyof Collections> = {
	type: 'db';
	collection: TName;
	items: Collections[TName][];
};

export interface Collections {
	creature: Creature;
}
export default class RoomHostConnection<
	TName extends keyof Collections,
> extends RemoteApi<
	ClientToRoomHostRequest<TName>,
	RoomHostToClientResponse<TName>,
	void,
	void,
	void,
	RoomHostToClientNotification<TName>
> {
	constructor(transportFactory: TransportFactory<string>) {
		super(z.void(), z.any(), z.any(), transportFactory);
	}
}
