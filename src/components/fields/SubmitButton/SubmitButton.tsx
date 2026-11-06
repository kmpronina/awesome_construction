import { useFormikContext } from 'formik';

/* UI */
import { Button, type ButtonProps } from '@/components/ui/Button';

interface SubmitButtonProps extends Omit<ButtonProps, 'isLoading'> {
	isChangeRequired?: boolean;
}

const SubmitButton = (props: SubmitButtonProps) => {
	const { children, isChangeRequired, isDisabled, ...restProps } = props;

	const formik = useFormikContext();

	return (
		<Button type="submit" isLoading={formik.isSubmitting} isDisabled={isDisabled || (!formik.dirty && isChangeRequired)} {...restProps}>
			{children}
		</Button>
	);
};

export { SubmitButton };
