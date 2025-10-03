import type { UserMessage } from '@/sync/message/raw';
import type { MemberId } from '@/sync/room/types';

export type OutboundSystemMessage = { to?: MemberId; data: UserMessage };
