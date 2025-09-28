import { useContext } from 'react';

import { ShareContext } from '@/context/ShareContext';

export function useShareCode() {
	return useContext(ShareContext);
}
