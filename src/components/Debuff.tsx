import { cn } from '@/lib/utils';
import { Debuff as DebuffObj } from '@/type/Debuff';
import { useMemo, type ComponentPropsWithoutRef } from 'react';
import { Badge } from './ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';

export default function Debuff({
	debuff,
	className,
	...props
}: { debuff: DebuffObj } & ComponentPropsWithoutRef<typeof Badge>) {
	const flat = useMemo(() => DebuffObj.flat(debuff), [debuff]);

	const badge = (
		<Badge className={cn(className, flat.color)} {...props}>
			{flat.name}
		</Badge>
	);

	if (flat.description) {
		return (
			<HoverCard>
				<HoverCardTrigger asChild>{badge}</HoverCardTrigger>
				<HoverCardContent>{flat.description}</HoverCardContent>
			</HoverCard>
		);
	}
	return badge;
}
