import { Tables, TablesInsert } from './database';

export interface SelectItem {
	id: number;
	label: string;
	value: string;
}

export type ConstructionItem = Pick<Tables<'constructions'>, 'id' | 'title' | 'address' | 'author_id' | 'created_at'>;

export type UserItem = Pick<Tables<'profiles'>, 'id' | 'email' | 'name' | 'role'>;

export type TaskItem = Pick<Tables<'tasks'>, 'id' | 'title' | 'description' | 'status' | 'construction_id' | 'author_id' | 'executor_id' | 'created_at'>;

// Fields that decide who can act on a task
export type TaskAccess = Pick<TaskItem, 'status' | 'author_id' | 'executor_id'>;

// Task for lists and cards: the status label comes from the statuses table
export type TaskListItem = TaskItem & {
	statusInfo: Pick<Tables<'statuses'>, 'label'> | null;
};

// Task with related records for the task page; relations can be null if RLS hides the row
export type TaskDetailsItem = TaskListItem & {
	construction: Pick<ConstructionItem, 'id' | 'title'> | null;
	executor: Pick<UserItem, 'id' | 'name' | 'email'> | null;
	author: Pick<UserItem, 'id' | 'name' | 'email'> | null;
};

// One status change with the editor and status labels; relations can be null if RLS hides the row
export type TaskHistoryItem = Pick<Tables<'task_history'>, 'id' | 'from_status' | 'to_status' | 'comment' | 'created_at'> & {
	editor: Pick<UserItem, 'id' | 'name' | 'email'> | null;
	fromStatusInfo: Pick<Tables<'statuses'>, 'label'> | null;
	toStatusInfo: Pick<Tables<'statuses'>, 'label'> | null;
};

export interface ConstructionFields {
	title: string;
	address: string;
}

export interface TaskFields {
	title: string;
	description: string;
	construction: SelectItem | null;
	executor: SelectItem | null;
}

export type TaskCreateFields = Pick<TablesInsert<'tasks'>, 'title' | 'description' | 'construction_id' | 'executor_id'>;

// Only title and description can be changed: construction and executor are set once
export type TaskUpdateFields = Pick<TaskCreateFields, 'title' | 'description'>;

// A status change available to the current user for the current task status
export type TransitionItem = Pick<Tables<'status_transitions'>, 'to_status' | 'action_label' | 'requires_comment'>;

export interface TaskStatusFields {
	comment: string;
}
