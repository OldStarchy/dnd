import { z } from 'zod';

export const serverResponseSpec = z.any(); // TODO: Replace with a more specific schema if possible

export type ServerResponse = z.infer<typeof serverResponseSpec>;
