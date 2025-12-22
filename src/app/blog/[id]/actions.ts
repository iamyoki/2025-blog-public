'use server'

import { getAppOctokitContext } from '@/app/actions'
import { container } from '@/di/container'
import { OctokitContext } from '@/infrastructure/contexts/octokit.context'
import { cacheTag } from 'next/cache'

export async function getArticleDetail(slug: string) {
	'use cache'
	cacheTag(`blog/${slug}`)
	const octokit = await getAppOctokitContext()
	return OctokitContext.run(octokit, async () => {
		return container.articleController.getArticleDetail(slug)
	})
}
