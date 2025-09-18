import { AsyncResult } from '@/lib/AsyncResult';
import { Result } from '@/lib/Result';
import { z } from 'zod';
import { inboundSystemMessageSchema } from '../message/schema/InboundSystemMessage';
import { ClosableJsonTransport } from '../transports/JsonTransport';
import ReconnectingWebSocket from './ReconnectingWebSocket';
import RoomHostConnection from './RoomHostConnection';
import type { MembershipToken } from './types';

const roomCreated = z.object({
	membershipToken: z.string().brand<'MembershipToken'>(),
	roomCode: z.string().brand<'RoomCode'>(),
});
const roomJoined = z.object({
	membershipToken: z.string().brand<'MembershipToken'>(),
});
const roomFound = z.object({
	roomCode: z.string().brand<'RoomCode'>(),
	id: z.string().brand<'MemberId'>(),
	gameMasterId: z.string().brand<'MemberId'>(),
	members: z
		.object({
			id: z.string().brand<'MemberId'>(),
			online: z.boolean(),
		})
		.array(),
});

export default class RoomHost {
	static registry = new Map<string, RoomHost>();

	static get(host: string): RoomHost {
		let existing = this.registry.get(host);
		if (!existing) {
			existing = new RoomHost(host);
			this.registry.set(host, existing);
		}
		return existing;
	}

	readonly host: string;

	private constructor(host: string) {
		this.host = host;
	}

	readonly room = new RoomResource(this);
}

const fetchResult = AsyncResult.wrapFn(fetch)<DOMException | TypeError>;

class RoomResource {
	private server: RoomHost;
	constructor(host: RoomHost) {
		this.server = host;
	}

	create() {
		return fetchResult(`${this.server.host}/room`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.andThen(Result.responseOk)
			.andTry<unknown, SyntaxError>((response) => response.json())
			.andThen((data) => Result.zodParse(roomCreated, data));
	}

	join(roomCode: string) {
		return fetchResult(`${this.server.host}/room/${roomCode}/join`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.andThen(Result.responseOk)
			.andTry<unknown, SyntaxError>((response) => response.json())
			.andThen((data) => Result.zodParse(roomJoined, data));
	}

	leave(membershipToken: MembershipToken) {
		return fetchResult(`${this.server.host}/room/leave`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		})
			.andThen(Result.responseOk)
			.map<void>(() => undefined);
	}

	get(membershipToken: MembershipToken) {
		return fetchResult(`${this.server.host}/room`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		})
			.andThen(Result.responseOk)
			.andTry<unknown, SyntaxError>((response) => response.json())
			.andThen((data) => Result.zodParse(roomFound, data));
	}

	delete(membershipToken: MembershipToken) {
		return fetchResult(`${this.server.host}/room`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		})
			.andThen(Result.responseOk)
			.map<void>(() => undefined);
	}

	connect(membershipToken: MembershipToken) {
		return this.get(membershipToken).map(
			({ id, gameMasterId, members, roomCode }) => {
				const ws = new ReconnectingWebSocket(
					`${this.server.host.replace(/^http/, 'ws')}/room/ws/${membershipToken}`,
				);

				const connection = new ClosableJsonTransport(
					ws,
					inboundSystemMessageSchema,
				);

				return new RoomHostConnection(
					id,
					gameMasterId,
					members,
					this.server,
					roomCode,
					connection,
				);
			},
		);
	}
}
