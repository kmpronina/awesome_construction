import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

/* Icons */
const iconProps = {
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': true
} as const;

const SuccessIcon = () => (
	<svg {...iconProps} className="size-5 text-emerald-400">
		<circle cx="12" cy="12" r="10" />
		<path d="m8 12 3 3 5-6" />
	</svg>
);

const ErrorIcon = () => (
	<svg {...iconProps} className="size-5 text-red-400">
		<circle cx="12" cy="12" r="10" />
		<path d="m15 9-6 6M9 9l6 6" />
	</svg>
);

const InfoIcon = () => (
	<svg {...iconProps} className="size-5 text-sky-400">
		<circle cx="12" cy="12" r="10" />
		<path d="M12 16v-4M12 8h.01" />
	</svg>
);

const Toaster = () => {
	return (
		<SonnerToaster
			toastOptions={{
				unstyled: true,
				classNames: {
					toast: 'flex w-full items-center gap-3 rounded-lg bg-green px-4 py-3 text-light shadow-lg',
					title: 'text-sm font-medium',
					icon: 'flex size-5 shrink-0 items-center justify-center'
				}
			}}
			icons={{
				success: <SuccessIcon />,
				error: <ErrorIcon />,
				info: <InfoIcon />
			}}
			position="bottom-center"
		/>
	);
};

interface ToastItem {
	success: (value: string, duration?: number) => void;
	error: (value: string, duration?: number) => void;
	info: (value: string, duration?: number) => void;
}

const toast: ToastItem = {
	success: (value, duration = 3000) => {
		sonnerToast.success(value, { duration });
	},

	error: (value, duration = 3000) => {
		sonnerToast.error(value, { duration });
	},

	info: (value, duration = 3000) => {
		sonnerToast.info(value, { duration });
	}
};

export { toast, Toaster };
