import type { UserItem } from '@/types';
import type { Enums } from '@/types/database';

/* Store */
export interface StoreState {
	loading: boolean;
	loaded: boolean;

	user: UserItem | null;
}

export interface StoreActions {
	doLogin: (fields: LoginFields) => Promise<boolean>;
	tryAuth: () => Promise<boolean>;
	clearUser: () => void;
	doLogout: () => Promise<void>;
}

/* Items */
export type UserRole = Enums<'user_role'>;

/* Forms */
export interface LoginFields {
	email: string;
	password: string;
}
