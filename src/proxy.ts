import { cookies } from 'next/headers'
import { NextRequest, NextResponse, ProxyConfig } from 'next/server'
import { container } from './di/container'

export async function proxy(request: NextRequest) {
	console.log(request.nextUrl.pathname)
	if (request.nextUrl.pathname.startsWith('/write')) {
		const cookie = await cookies()
		const session = cookie.has('session')
		if (!session) {
			const oauthUrl = container.authenticationController.getOauthUrl(
				request.nextUrl.origin,
				request.url
			)
			return NextResponse.redirect(oauthUrl)
		}
	}
}

export const config: ProxyConfig = {
	matcher: ['/write', '/write/:path']
}
