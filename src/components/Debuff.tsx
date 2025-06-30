import { cn } from '@/lib/utils';
import { Debuff as DebuffObj } from '@/type/Debuff';
import { useMemo, type ComponentPropsWithoutRef } from 'react';
import { Badge } from './ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Separator } from './ui/separator';

export default function Debuff({
	debuff,
	className,
	...props
}: { debuff: DebuffObj } & ComponentPropsWithoutRef<typeof Badge>) {
	const flat = useMemo(() => DebuffObj.flat(debuff), [debuff]);

	const badge = (
		<Badge className={cn(className, flat.color)} {...props}>
			{flat.name}
			{debuff.duration !== undefined ? ` (${debuff.duration})` : ''}
		</Badge>
	);

	if (flat.description || flat.notes) {
		return (
			<HoverCard openDelay={100} closeDelay={100}>
				<HoverCardTrigger asChild>{badge}</HoverCardTrigger>
				<HoverCardContent>
					{flat.notes && <p>{flat.notes}</p>}
					{flat.description && flat.notes && (
						<Separator className="my-1" />
					)}
					{flat.description && (
						<p className="italic text-muted-foreground">
							{flat.description}
						</p>
					)}
				</HoverCardContent>
			</HoverCard>
		);
	}
	return badge;
}
