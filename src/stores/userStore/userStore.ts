import type { UserItem } from '@/types';
import type { StoreActions, StoreState } from '@/types/stores/userStore';

import { createClient } from '@/libs/supabase/client';
import { createStore } from '@/libs/zustand';

const supabase = createClient();

const initialStore: StoreState = {
	loading: false,
	loaded: false,
	user: null
};

// Role and name live in public.profiles, not in auth.users
const fetchProfile = async (userId: string): Promise<UserItem> => {
	const { data, error } = await supabase.from('profiles').select('id, email, name, role').eq('id', userId).single();

	if (error) throw error;

	return data;
};

const userStore = createStore<StoreState & StoreActions>((set, get) => ({
	...initialStore,
	doLogin: async ({ email, password }) => {
		set((state) => {
			state.loading = true;
		});

		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });

			if (error) throw error;

			try {
				const user = await fetchProfile(data.user.id);

				set((state) => {
					state.user = user;
					state.loaded = true;
				});
			} catch (profileError) {
				// A user without a profile has no role: do not keep the session
				await supabase.auth.signOut();

				throw profileError;
			}

			return true;
		} finally {
			set((state) => {
				state.loading = false;
			});
		}
	},
	tryAuth: async () => {
		set((state) => {
			state.loading = true;
		});

		try {
			// getUser validates the session with Supabase Auth, unlike getSession
			const { data } = await supabase.auth.getUser();

			if (!data.user) {
				get().clearUser();

				return false;
			}

			try {
				const user = await fetchProfile(data.user.id);

				set((state) => {
					state.user = user;
					state.loaded = true;
				});
			} catch (profileError) {
				// Same as in doLogin: a session without a profile must be closed,
				// otherwise the layout and proxy.ts keep redirecting to each other
				await supabase.auth.signOut();

				throw profileError;
			}

			return true;
		} finally {
			set((state) => {
				state.loading = false;
			});
		}
	},
	clearUser: () => {
		// loaded stays true: the auth check is finished, there is just no user
		set((state) => {
			state.user = null;
			state.loaded = true;
			state.loading = false;
		});
	},
	doLogout: async () => {
		const { error } = await supabase.auth.signOut();

		if (error) throw error;

		get().clearUser();
	}
}));

export default userStore;
