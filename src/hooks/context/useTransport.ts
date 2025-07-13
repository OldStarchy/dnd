import { TranpsortContext } from '@/context/TransportContext';
import { useContext } from 'react';

export default function useTransport() {
	return useContext(TranpsortContext);
}
