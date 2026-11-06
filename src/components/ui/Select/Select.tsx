'use client';

import React from 'react';

/* Types */
import { SelectItem } from '@/types';

/* UI */
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { InputTrigger } from '@/components/ui/InputTrigger';
import { ScrollArea } from '@/components/ui/ScrollArea';

export interface SelectProps {
	className?: string;
	id?: string;
	value: SelectItem | null;
	placeholder?: string;
	items: SelectItem[];
	isInvalid?: boolean;
	isDisabled?: boolean;
	onSelect: (value: SelectItem) => void;
}

const Select = (props: SelectProps) => {
	const { className, value = null, placeholder, items = [], onSelect, isInvalid, isDisabled } = props;

	const [isOpen, setIsOpen] = React.useState(false);

	const handleOpenChange = (state: boolean) => {
		if (isDisabled) return;

		setIsOpen(state);
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
			<DropdownMenuTrigger asChild>
				<InputTrigger className={className} valueSelect={value} placeholder={placeholder} isInvalid={isInvalid} isDisabled={isDisabled} />
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-[110px]">
				<ScrollArea className="max-h-[250px]">
					{items.map((item) => (
						<DropdownMenuItem
							key={item.value}
							className="data-[disabled]:font-medium data-[disabled]:text-green data-[disabled]:opacity-100!"
							onSelect={() => onSelect(item)}
							isDisabled={item.value === value?.value}
						>
							<div className="flex min-w-0 flex-1 items-center gap-2">
								<div className="flex-1 truncate">{item.label}</div>
							</div>
						</DropdownMenuItem>
					))}
				</ScrollArea>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

Select.displayName = 'Select';

export { Select };
