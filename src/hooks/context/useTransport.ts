import { TransportContext } from '@/context/TransportContext';
import { useContext } from 'react';

export default function useTransport() {
	return useContext(TransportContext);
}
