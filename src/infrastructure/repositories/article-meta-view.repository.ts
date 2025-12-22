import { UnauthorizedError } from '@/core/common/errors/unauthorized.error'
import { ArticleMetaViewRepositoryInterface } from '@/core/domain/interfaces/article-meta-view.repository.interface'
import { ArticleMetaViewModel } from '@/core/domain/view-models/article-meta.view-model'
import { OctokitContext } from '../contexts/octokit.context'
import { MetaItem } from './article.repository'

export class ArticleMetaViewRepository
	implements ArticleMetaViewRepositoryInterface
{
	async findOne(slug: string): Promise<ArticleMetaViewModel | undefined> {
		const all = await this.findAll()
		return all.find(item => item.slug === slug)
	}

	async findAll(): Promise<ArticleMetaViewModel[]> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'
		const metaPath = `public/meta.json`

		const { data: metaData } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path: metaPath,
			ref: branch
		})
		if (Array.isArray(metaData)) return []
		if (metaData.type !== 'file') return []
		const meta: MetaItem[] = JSON.parse(
			Buffer.from(metaData.content, 'base64').toString('utf8')
		)

		return meta.map(item => ({
			slug: item.slug,
			actor: item.actor,
			title: item.title,
			summary: item.summary,
			coverUrl: item.coverUrl,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			categories: item.categories,
			tags: item.tags
		}))
	}
}
