export type OmitReadonlyProps<T> = {
	[K in keyof T as Equal<{ [P in K]: T[P] }, { readonly [P in K]: T[P] }> extends true
		? never
		: K]: T[K];
};

// Helper type to check for deep equality (needed for readonly checks)
export type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
