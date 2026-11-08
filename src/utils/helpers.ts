import type { UserItem } from '@/types';

export const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Pages render on the server, so the time zone is fixed and shown explicitly
export const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: 'UTC',
	timeZoneName: 'short'
});

// Users without a name are shown by email
export const getUserLabel = (user: Pick<UserItem, 'name' | 'email'> | null) => {
	if (!user) return '—';

	return user.name || user.email;
};
