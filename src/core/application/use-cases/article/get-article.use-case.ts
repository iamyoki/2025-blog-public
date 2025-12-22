import { NotFoundError } from '@/core/common/errors/not-found.error'
import { ArticleRepositoryInterface } from '@/core/domain/interfaces/article.repository.interface'

export class GetArticleUseCase {
	constructor(private readonly articleRepository: ArticleRepositoryInterface) {}

	async execute(slug: string) {
		const article = await this.articleRepository.findOne(slug)
		if (!article) throw new NotFoundError(`Slug ${slug} not found`)
		return {
			slug: article.slug,
			actor: article.actor,
			title: article.title,
			summary: article.summary,
			content: article.content,
			coverUrl: article.coverUrl,
			createdAt: article.createdAt,
			updatedAt: article.updatedAt,
			categories: article.categories,
			tags: article.tags
		}
	}
}
