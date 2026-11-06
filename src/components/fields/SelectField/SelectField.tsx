'use client';

import { useField, useFormikContext } from 'formik';

/* Types */
import type { SelectItem } from '@/types';

/* UI */
import { Select, type SelectProps } from '@/components/ui/Select';

/* Fields */
import { DescriptionField } from '@/components/fields/DescriptionField';
import { LabelField } from '@/components/fields/LabelField';

interface SelectFieldProps extends Omit<SelectProps, 'value' | 'isInvalid' | 'onSelect'> {
	id?: string;
	label?: string;
	description?: string;
	name: string;
	onSelect?: (value: SelectItem) => void;
}

const SelectField = (props: SelectFieldProps) => {
	const { className, id, label, description, name, isDisabled, onSelect, ...restProps } = props;

	const [field, meta, helpers] = useField<SelectItem | null>(name);

	const { isSubmitting } = useFormikContext();

	const hasErrors = !!meta.error;

	const handleSelect = (item: SelectItem) => {
		helpers.setError(undefined);
		helpers.setValue(item);

		if (onSelect) onSelect(item);
	};

	return (
		<div className={className}>
			{!!label && (
				<LabelField id={id} isDisabled={isDisabled || isSubmitting}>
					{label}
				</LabelField>
			)}

			<Select
				id={id}
				value={field.value}
				isInvalid={hasErrors}
				isDisabled={isDisabled || isSubmitting}
				onSelect={handleSelect}

				{...restProps}
			/>

			{hasErrors && <DescriptionField isInvalid>{meta.error}</DescriptionField>}

			{!hasErrors && !!description && <DescriptionField>{description}</DescriptionField>}
		</div>
	);
};

SelectField.displayName = 'SelectField';

export { SelectField };
