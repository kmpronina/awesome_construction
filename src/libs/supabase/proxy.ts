import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

const LOGIN_PATH = '/login';

// Redirect that keeps the refreshed session cookies, otherwise the browser would not get the new token
const redirectTo = (request: NextRequest, response: NextResponse, pathname: string) => {
	const url = request.nextUrl.clone();
	url.pathname = pathname;

	const redirectResponse = NextResponse.redirect(url);
	response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));

	return redirectResponse;
};

// Refreshes the auth token in cookies and redirects guests to the login page.
// This is a UI convenience only: data access is enforced by RLS in the database.
export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({ request });

	const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet, headers) {
				// Pass refreshed cookies to Server Components of this request
				cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

				// Send refreshed cookies to the browser
				response = NextResponse.next({ request });
				cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));

				// No-cache headers: a CDN must not serve one user's session to another
				Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
			}
		}
	});

	// Do not add code between createServerClient and getClaims:
	// getClaims triggers the token refresh
	const { data } = await supabase.auth.getClaims();
	const isAuthenticated = Boolean(data?.claims);
	const isLoginPage = request.nextUrl.pathname.startsWith(LOGIN_PATH);

	if (!isAuthenticated && !isLoginPage) {
		return redirectTo(request, response, LOGIN_PATH);
	}

	if (isAuthenticated && isLoginPage) {
		return redirectTo(request, response, '/');
	}

	return response;
}
