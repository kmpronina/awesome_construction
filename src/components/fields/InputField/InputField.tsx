'use client';

import { useField, useFormikContext } from 'formik';

/* UI */
import { Input, type InputProps, InputValues } from '@/components/ui/Input';

/* Fields */
import { DescriptionField } from '@/components/fields/DescriptionField';
import { LabelField } from '@/components/fields/LabelField';

export interface InputFieldProps extends Omit<InputProps, 'name' | 'isInvalid'> {
	label?: string;
	description?: string;
	name: string;
	fieldArrayError?: string | boolean;
}

const InputField = (props: InputFieldProps) => {
	const { className, label, description, id, name, isDisabled, onChange, ...restProps } = props;

	const { isSubmitting } = useFormikContext();

	const [field, meta, helpers] = useField<InputValues>(name);

	const hasErrors = !!meta.error;

	const handleChange = (value: string) => {
		helpers.setError(undefined);
		helpers.setValue(value);

		if (onChange) onChange(value);
	};

	return (
		<div className={className}>
			{label && (
				<LabelField id={id} isDisabled={isDisabled}>
					{label}
				</LabelField>
			)}

			<Input
				id={id}
				name={name}
				value={field.value}
				onChange={handleChange}
				isInvalid={hasErrors}
				isDisabled={isDisabled || isSubmitting}
				{...restProps}
			/>

			{(hasErrors || description) && <DescriptionField isInvalid={hasErrors}>{hasErrors ? meta.error : description}</DescriptionField>}
			{!hasErrors && !!description && <DescriptionField isInvalid={hasErrors}>{description}</DescriptionField>}
		</div>
	);
};

InputField.displayName = 'InputField';

export { InputField };
