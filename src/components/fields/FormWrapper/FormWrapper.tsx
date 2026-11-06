'use client';

import React, { Ref } from 'react';
import { Formik, FormikHelpers, FormikProps } from 'formik';

interface FormWrapperProps {
	ref?: Ref<FormikProps<any>>;
	className?: string;
	children: React.ReactNode;
	fields: any;
	schema?: any;
	errors?: any;
	validateOnChange?: boolean;
	validateOnBlur?: boolean;
	onSubmit: (values: any, actions: FormikHelpers<any>) => void;
}

const FormWrapper = (props: FormWrapperProps) => {
	const { ref, className, fields, schema, errors, validateOnChange = false, validateOnBlur = false, onSubmit, children, ...restProps } = props;

	return (
		<Formik
			innerRef={ref}
			initialValues={fields}
			initialErrors={errors}
			validationSchema={schema}
			validateOnChange={validateOnChange}
			validateOnBlur={validateOnBlur}
			onSubmit={onSubmit}
			{...restProps}
		>
			{(props) => {
				return (
					<form className={className} onSubmit={props.handleSubmit}>
						{children}
					</form>
				);
			}}
		</Formik>
	);
};

FormWrapper.displayName = 'FormWrapper';

export { FormWrapper };
export type { FormikHelpers, FormikProps };
