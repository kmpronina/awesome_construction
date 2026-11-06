import { type NextRequest } from 'next/server';

import { updateSession } from '@/libs/supabase/proxy';

export async function proxy(request: NextRequest) {
	return updateSession(request);
}

export const config = {
	matcher: [
		// Skip static files, image optimization and images from public/
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
	]
};
