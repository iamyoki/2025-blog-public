import { NotFoundError } from '@/core/common/errors/not-found.error'
import { ArticleMetaViewRepositoryInterface } from '@/core/domain/interfaces/article-meta-view.repository.interface'
import { ArticleRepositoryInterface } from '@/core/domain/interfaces/article.repository.interface'
import { ArticleMetaViewModel } from '@/core/domain/view-models/article-meta.view-model'

export class UpdateArticleUseCase {
	constructor(
		private readonly articleRepository: ArticleRepositoryInterface,
		private readonly articleMetaViewRepository: ArticleMetaViewRepositoryInterface
	) {}

	async execute(
		slug: string,
		title: string,
		summary: string | undefined,
		content: string,
		coverUrl: string | undefined,
		categories: string[] | undefined,
		tags: string[] | undefined
	) {
		const article = await this.articleRepository.findOne(slug)
		if (!article) throw new NotFoundError(`Slug ${slug} not found`)

		article.update(title, summary, content, coverUrl, categories, tags)
		const meta: ArticleMetaViewModel = {
			slug: article.slug,
			title: article.title,
			coverUrl: article.coverUrl,
			createdAt: article.createdAt,
			categories: article.categories,
			summary: article.summary,
			tags: article.tags,
			updatedAt: article.updatedAt
		}

		// should be in transaction
		await this.articleRepository.save(article)
		await this.articleMetaViewRepository.save(meta)
	}
}
