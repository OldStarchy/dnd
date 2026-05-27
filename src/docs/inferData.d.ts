import * as Y from 'yjs';

export type inferData<T> = T extends string | number | boolean | null | undefined
	? T
	: T extends { export(): infer U }
		? U
		: T extends Y.Text
			? string
			: T extends Y.Array<infer U>
				? inferData<U>[]
				: T extends Y.Map<infer U>
					? Record<string, inferData<U>>
					: T extends object
						? { [K in keyof T]: inferData<T[K]> }
						: T;
