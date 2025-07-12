import { PopoutContext } from '@/context/PopoutContext';
import { useContext } from 'react';

export function usePopout() {
	const context = useContext(PopoutContext);
	if (!context) {
		throw new Error('usePopout must be used within a PopoutProvider');
	}
	return context;
}
