import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalConfig } from '@/hooks/useLocalConfig';
import { useEffect, useState } from 'react';

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const [localConfig, setLocalConfig] = useLocalConfig();
	const [tempServerUrl, setTempServerUrl] = useState(localConfig.hostUrl);

	useEffect(() => {
		if (!open) {
			setTempServerUrl(localConfig.hostUrl);
		}
	}, [open, localConfig]);

	const handleSave = () => {
		setLocalConfig((cfg) => ({ ...cfg, hostUrl: tempServerUrl }));
		onOpenChange(false);
	};

	const handleCancel = () => {
		setTempServerUrl(localConfig.hostUrl);
		onOpenChange(false);
	};

	const handleReset = () => {
		setTempServerUrl('');
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Configure your server connection settings. Leave blank
						to use the current page's server.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="server-url" className="text-right">
							Server URL
						</Label>
						<div className="col-span-3 space-y-2">
							<Input
								id="server-url"
								type="url"
								placeholder="https://your-server.com"
								value={tempServerUrl}
								onChange={(e) =>
									setTempServerUrl(e.target.value)
								}
							/>
							<p className="text-xs text-muted-foreground">
								Enter the full URL of your D&D server (e.g.
								https://your-server.com)
							</p>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleReset}>
						Reset to Default
					</Button>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
