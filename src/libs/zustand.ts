import { type StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

// Store with immer (mutable-style updates in set) and shallow comparison by default,
// so selectors returning arrays or objects do not cause extra re-renders
export const createStore = <T>(fn: StateCreator<T, [['zustand/immer', never]]>) => {
	return createWithEqualityFn<T>()(immer(fn), shallow);
};
