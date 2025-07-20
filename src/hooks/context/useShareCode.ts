import { ShareContext } from '@/context/ShareContext';
import { useContext } from 'react';

export function useShareCode() {
	return useContext(ShareContext);
}
