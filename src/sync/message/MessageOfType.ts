export type MessageOfType<
	Root extends { type: string },
	T extends Root['type'],
> = Extract<Root, { type: T; data: unknown }>['data'];
