import type z from 'zod';

export type MembershipToken = string & z.$brand<'MembershipToken'>;
export type RoomCode = string & z.$brand<'RoomCode'>;
export type MemberId = string & z.$brand<'MemberId'>;

export function MembershipToken(token: string): MembershipToken {
	return token as MembershipToken;
}

export function RoomCode(code: string): RoomCode {
	return code as RoomCode;
}

export function MemberId(id: string): MemberId {
	return id as MemberId;
}
