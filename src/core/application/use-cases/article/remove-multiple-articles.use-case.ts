import { ArticleRepositoryInterface } from '@/core/domain/interfaces/article.repository.interface'

export class RemoveMultipleArticlesUseCase {
	constructor(private readonly articleRepository: ArticleRepositoryInterface) {}

	async execute(slugs: string[]) {
		return await this.articleRepository.removeBySlugs(slugs)
	}
}
