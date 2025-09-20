import type { AsyncResult } from '@/lib/AsyncResult';
import { Err, Ok, Result, UnknownError } from '@/lib/Result';
import {
	FetchError,
	fetchResult,
	responseOk,
	ServerResponseError,
	UnexpectedStatusError,
	validateJsonResponse,
} from '@/lib/result/fetch';
import { StatusCodes } from 'http-status-codes';
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

type CreateRoomResponse = AsyncResult<
	z.infer<typeof roomCreated>,
	FetchError | ServerResponseError | UnknownError
>;
type DeleteRoomResponse = AsyncResult<
	void,
	| 'invalid_token'
	| 'not_found'
	| 'forbidden'
	| FetchError
	| ServerResponseError
	| UnknownError
>;

type GetRoomResponse = AsyncResult<
	z.infer<typeof roomFound>,
	'invalid_token' | 'not_found' | FetchError | ServerResponseError
>;

type JoinRoomResponse = AsyncResult<
	z.infer<typeof roomJoined>,
	'not_found' | FetchError | ServerResponseError
>;

type LeaveRoomResponse = AsyncResult<
	void,
	| 'invalid_token'
	| 'not_found'
	| 'is_owner'
	| FetchError
	| ServerResponseError
>;

type ConnectResult = AsyncResult<
	RoomHostConnection,
	| 'not_found'
	| 'invalid_token'
	| FetchError
	| ServerResponseError
	| UnknownError
>;

class RoomResource {
	private server: RoomHost;
	constructor(host: RoomHost) {
		this.server = host;
	}

	create(): CreateRoomResponse {
		return fetchResult(`${this.server.host}/room`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.andThen(responseOk)
			.andThen(validateJsonResponse(roomCreated));
	}

	join(roomCode: string): JoinRoomResponse {
		return fetchResult(`${this.server.host}/room/${roomCode}/join`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.andThen(
				(
					response,
				): Result<Response, Result.InferErr<JoinRoomResponse>> => {
					switch (response.status) {
						case StatusCodes.OK:
							return Ok(response);

						case StatusCodes.NOT_FOUND:
							return Err('not_found');

						default:
							return Err(
								new UnknownError(
									new UnexpectedStatusError(response.status),
								),
							);
					}
				},
			)
			.andThen(validateJsonResponse(roomJoined));
	}

	leave(membershipToken: MembershipToken): LeaveRoomResponse {
		return fetchResult(`${this.server.host}/room/leave`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		}).andThen((response): Result.Infer<LeaveRoomResponse> => {
			switch (response.status) {
				case StatusCodes.NO_CONTENT:
					return Ok(undefined as void);

				case StatusCodes.UNAUTHORIZED:
					return Err('invalid_token');

				case StatusCodes.NOT_FOUND:
					return Err('not_found');

				case StatusCodes.FORBIDDEN:
					return Err('is_owner');

				default:
					return Err(
						new UnknownError(
							new UnexpectedStatusError(response.status),
						),
					);
			}
		});
	}

	get(membershipToken: MembershipToken): GetRoomResponse {
		return fetchResult(`${this.server.host}/room`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		})
			.andThen(
				(
					response,
				): Result<Response, Result.InferErr<GetRoomResponse>> => {
					switch (response.status) {
						case StatusCodes.OK:
							return Ok(response);

						case StatusCodes.NOT_FOUND:
							return Err('not_found');

						case StatusCodes.UNAUTHORIZED:
							return Err('invalid_token');

						default:
							return Err(
								new UnknownError(
									new UnexpectedStatusError(response.status),
								),
							);
					}
				},
			)
			.andThen(validateJsonResponse(roomFound));
	}

	delete(membershipToken: MembershipToken): DeleteRoomResponse {
		return fetchResult(`${this.server.host}/room`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		}).andThen((response): Result.Infer<DeleteRoomResponse> => {
			switch (response.status) {
				case StatusCodes.NO_CONTENT:
					return Ok(undefined);

				case StatusCodes.UNAUTHORIZED:
					return Err('invalid_token');

				case StatusCodes.NOT_FOUND:
					return Err('not_found');

				case StatusCodes.FORBIDDEN:
					return Err('forbidden');

				default:
					return Err(
						new UnknownError(
							new UnexpectedStatusError(response.status),
						),
					);
			}
		});
	}

	connect(membershipToken: MembershipToken): ConnectResult {
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
