'use server'

import { container } from '@/di/container'
import { ActiveUserPayloadContext } from '@/infrastructure/contexts/active-user-payload.context'
import { OctokitContext } from '@/infrastructure/contexts/octokit.context'
import { ArticleFormSchema } from '@/presentation/controllers/article.controller'
import z from 'zod'
import { getRequestUserContext } from '../actions'

export async function createArticle(input: z.infer<typeof ArticleFormSchema>) {
	const { activeUserPayload, octokit } = await getRequestUserContext()

	await ActiveUserPayloadContext.run(activeUserPayload, () =>
		OctokitContext.run(octokit, () =>
			container.articleController.createArticle(input)
		)
	)
}
