'use server'

import { OctokitContext } from '@/infrastructure/contexts/octokit.context'
import { getAppOctokitContext } from '../actions'
import { container } from '@/di/container'
import { ArticleMetaViewModel } from '@/core/domain/view-models/article-meta.view-model'
import { cacheTag } from 'next/cache'

export async function getArticleMetaList(): Promise<ArticleMetaViewModel[]> {
	'use cache'
	cacheTag('articles')
	const octokit = await getAppOctokitContext()
	return await OctokitContext.run(octokit, async () => {
		return await container.articleController.getArticleMetaList()
	})
}
