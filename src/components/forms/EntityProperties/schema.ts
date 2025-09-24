import { HealthObfuscation } from '@/store/types/Entity';
import { debuffSpec } from '@/type/Debuff';
import z from 'zod';

const entityPropertiesSchema = z.object({
	name: z.string().min(1, 'Name must be at least 1 characters long'),
	initiative: z.int().min(0, 'Initiative must be a non-negative integer'),
	images: z.array(z.string()).optional(),
	visible: z.boolean(),
	ac: z.int().min(0, 'AC must be a non-negative integer').optional(),
	hp: z.int(),
	maxHp: z.int().min(1, 'Max Health must be at least 1'),
	obfuscateHealth: z.enum(HealthObfuscation),
	debuffs: z.array(debuffSpec),
});

export default entityPropertiesSchema;

export type EntityProperties = z.infer<typeof entityPropertiesSchema>;
