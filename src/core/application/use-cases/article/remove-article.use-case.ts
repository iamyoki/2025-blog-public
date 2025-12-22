import { ArticleRepositoryInterface } from '@/core/domain/interfaces/article.repository.interface'

export class RemoveArticleUseCase {
	constructor(private readonly articleRepository: ArticleRepositoryInterface) {}

	async execute(slug: string) {
		return await this.articleRepository.removeOne(slug)
	}
}
