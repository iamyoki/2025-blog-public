'use server'

import { UnauthorizedError } from '@/core/common/errors/unauthorized.error'
import { ActiveUserPayload } from '@/core/common/types/active-user-payload.type'
import { container } from '@/di/container'
import { cookies } from 'next/headers'
import { App, Octokit } from 'octokit'

export async function getActionUserPayload(): Promise<
	ActiveUserPayload | undefined
> {
	const cookie = await cookies()
	const session = cookie.get('session')?.value
	if (!session) return
	const payload: ActiveUserPayload = JSON.parse(session)
	return payload
}

export async function getOauthUrl(origin: string, redirectPageUrl: string) {
	return container.authenticationController.getOauthUrl(origin, redirectPageUrl)
}

export async function getRequestUserContext(): Promise<{
	activeUserPayload: ActiveUserPayload
	octokit: Octokit
}> {
	const cookie = await cookies()
	const session = cookie.get('session')?.value
	if (!session) throw new UnauthorizedError()

	let activeUserPayload: ActiveUserPayload = JSON.parse(session)

	await container.authenticationController
		.verifySession(activeUserPayload)
		.catch(async () => {
			cookie.delete('session')
			activeUserPayload =
				await container.authenticationController.refreshSession(
					activeUserPayload
				)
			cookie.set('session', JSON.stringify(activeUserPayload))
		})

	const octokit = new Octokit({ auth: activeUserPayload.token })
	return {
		activeUserPayload,
		octokit
	}
}

let octokitPromiseCache: Promise<Octokit> | undefined
export async function getAppOctokitContext(): Promise<Octokit> {
	if (!octokitPromiseCache) {
		octokitPromiseCache = (async () => {
			const app = new App({
				appId: process.env.GITHUB_APP_ID!,
				privateKey: process.env.GITHUB_APP_PRIVATE_KEY!
			})

			const { data: installation } = await app.octokit.request(
				'GET /repos/{owner}/{repo}/installation',
				{
					owner: process.env.GITHUB_OWNER!,
					repo: process.env.GITHUB_REPO!
				}
			)

			const installationId = installation.id

			return await app.getInstallationOctokit(installationId)
		})()
	}
	return octokitPromiseCache
}
