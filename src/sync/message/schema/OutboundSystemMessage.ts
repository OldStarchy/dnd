import type { MemberId } from '@/sync/room/types';
import type { UserMessage } from '../raw';

export type OutboundSystemMessage = { to?: MemberId; data: UserMessage };
