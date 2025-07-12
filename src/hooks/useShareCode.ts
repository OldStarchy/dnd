import { ShareContext } from '@/context/ShareContext';
import { useContext } from 'react';

export function useShareCode() {
	const context = useContext(ShareContext);
	if (!context) {
		throw new Error('useShareCode must be used within a ShareProvider');
	}
	return context;
}
