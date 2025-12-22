import { container } from '@/di/container'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import z, { ZodError } from 'zod'

const { authenticationController } = container

export async function GET(request: NextRequest) {
	try {
		const cookie = await cookies()
		const code = request.nextUrl.searchParams.get('code')
		const state = request.nextUrl.searchParams.get('state')
		const activeUserPayload = await authenticationController.createSession(
			code!
		)
		const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
		const session = JSON.stringify(activeUserPayload)
		cookie.set('session', session, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			expires: expiresAt
		})
		return NextResponse.redirect(state ? decodeURIComponent(state) : '/')
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json(
				{
					success: false,
					error: 'ValidationError',
					details: z.flattenError(error)
				},
				{ status: 400 }
			)
		}

		if (error instanceof Error) {
			return NextResponse.json(
				{
					success: false,
					error: error.name,
					message: error.message
				},
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{
				success: false,
				error: 'InternalServerError'
			},
			{ status: 500 }
		)
	}
}
