import { ArticleRepositoryInterface } from '@/core/domain/interfaces/article.repository.interface'
import { Article } from '@/core/domain/models/article/article'

export class CreateArticleUseCase {
	constructor(private readonly articleRepository: ArticleRepositoryInterface) {}

	async execute(
		slug: string,
		actor: string,
		title: string,
		summary: string | undefined,
		content: string,
		coverUrl: string | undefined,
		categories: string[] | undefined,
		tags: string[] | undefined
	) {
		const article = Article.create(
			slug,
			actor,
			title,
			summary,
			content,
			coverUrl,
			categories,
			tags
		)
		// should be in transaction
		await this.articleRepository.save(article)
	}
}
