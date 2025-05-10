export type Entity = {
	initiative: number;
	name: string;
	id: string;
	health: number;
	tags: Array<{ name: string; color: string }>;
};
