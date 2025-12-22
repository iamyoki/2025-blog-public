import { UnauthorizedError } from '@/core/common/errors/unauthorized.error'
import { App, Octokit } from 'octokit'
import z from 'zod'
import { ActiveUserPayload } from '../../core/common/types/active-user-payload.type'

export class AuthenticationController {
	constructor() {}

	private app = new App({
		appId: process.env.GITHUB_APP_ID!,
		privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
		oauth: {
			clientType: 'github-app',
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
			allowSignup: false
		}
	})

	getOauthUrl(origin: string, redirectPageUrl: string): string {
		const url = this.app.oauth.getWebFlowAuthorizationUrl({
			redirectUrl: `${origin}/api/oauth/callback`,
			state: redirectPageUrl
		}).url
		return url
	}

	async createSession(code: string): Promise<ActiveUserPayload> {
		z.parse(z.string(), code)
		const {
			authentication: { token, refreshToken }
		} = await this.app.oauth.createToken({ code })
		const octokit = new Octokit({ auth: token })
		const user = await octokit.rest.users.getAuthenticated()
		const payload: ActiveUserPayload = {
			token,
			refreshToken,
			actor: user.data.login,
			avatar: user.data.avatar_url,
			email: user.data.email ?? undefined
		}
		return payload
	}

	async verifySession(sessionPayload: ActiveUserPayload): Promise<true> {
		try {
			await this.app.oauth.checkToken({ token: sessionPayload.token })
		} catch (error) {
			throw new UnauthorizedError('Invalid token')
		}

		return true
	}

	async refreshSession(
		sessionPayload: ActiveUserPayload
	): Promise<ActiveUserPayload> {
		if (!sessionPayload.refreshToken)
			throw new UnauthorizedError('Invalid refresh token')
		const {
			authentication: { token, refreshToken }
		} = await this.app.oauth.refreshToken({
			refreshToken: sessionPayload.refreshToken
		})
		return {
			...sessionPayload,
			token,
			refreshToken
		}
	}
}
