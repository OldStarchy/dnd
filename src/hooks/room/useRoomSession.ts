import { type RoomMetaIdBrand } from '@/sync/room/RoomMeta';
import z from 'zod';
import useJsonStorage from '../useJsonStorage';

const roomSessionSchema = z.object({
	lastRoom: z
		.discriminatedUnion('type', [
			z.object({
				type: z.literal('joined'),
			}),
			z.object({
				type: z.literal('hosted'),
				roomId: z.string().brand<RoomMetaIdBrand>(),
			}),
		])
		.and(
			z.object({
				host: z.string(),
				membershipToken: z.string().brand<'MembershipToken'>(),
				code: z.string().brand<'RoomCode'>(),
				name: z.string(),
			}),
		)
		.nullable()
		.default(null),
});

type RoomSession = z.infer<typeof roomSessionSchema>;

declare global {
	interface LocalStorageKeys {
		roomSession: RoomSession;
	}
}

/**
 * A storage for current (and previously) joined rooms.
 * This is used to restore sessions on page reloads.
 */
export default function useRoomSession() {
	return useJsonStorage('roomSession', { lastRoom: null }, roomSessionSchema);
}
