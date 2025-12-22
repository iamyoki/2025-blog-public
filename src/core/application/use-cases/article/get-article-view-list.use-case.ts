import { ArticleMetaViewRepositoryInterface } from '@/core/domain/interfaces/article-meta-view.repository.interface'
import { ArticleMetaViewModel } from '@/core/domain/view-models/article-meta.view-model'

export class GetArticleViewListUseCase {
	constructor(private readonly articleMetaViewRepository: ArticleMetaViewRepositoryInterface) {}

	async execute(): Promise<ArticleMetaViewModel[]> {
		return await this.articleMetaViewRepository.findAll()
	}
}
