import { createContext } from 'react';

export const PopoutContext = createContext<{
	setOpen(open: boolean): void;
} | null>(null);
