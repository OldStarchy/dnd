export const LOCAL_STORAGE_NAMESPACE = 'dnd';

type PageInfo = {
	title: string;
	url: string;
};

export const PAGES = {
	CREATURE_EDITOR: {
		title: 'Custom Heros & Creatures',
		url: '/characters',
	},
	ROOM_MANAGEMENT: {
		title: 'Create/Join Room',
		url: '/room',
	},
	ENCOUNTER: {
		title: 'Game Master View',
		url: '/encounter',
	},
} as const satisfies Record<string, PageInfo>;
