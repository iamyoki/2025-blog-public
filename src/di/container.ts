import { CreateArticleUseCase } from '@/core/application/use-cases/article/create-article.use-case'
import { GetArticleViewListUseCase } from '@/core/application/use-cases/article/get-article-view-list.use-case'
import { GetArticleUseCase } from '@/core/application/use-cases/article/get-article.use-case'
import { RemoveArticleUseCase } from '@/core/application/use-cases/article/remove-article.use-case'
import { RemoveMultipleArticlesUseCase } from '@/core/application/use-cases/article/remove-multiple-articles.use-case'
import { ArticleMetaViewRepository } from '@/infrastructure/repositories/article-meta-view.repository'
import { ArticleRepository } from '@/infrastructure/repositories/article.repository'
import { ArticleController } from '@/presentation/controllers/article.controller'
import { AuthenticationController } from '@/presentation/controllers/authentication.controller'

const articleRepository = new ArticleRepository()
const articleMetaViewRepository = new ArticleMetaViewRepository()

const createArticleUseCase = new CreateArticleUseCase(articleRepository)
const getArticleUseCase = new GetArticleUseCase(articleRepository)
const getArticleViewListUseCase = new GetArticleViewListUseCase(
	articleMetaViewRepository
)
const removeArticleUseCase = new RemoveArticleUseCase(articleRepository)
const removeMultipleArticlesUseCase = new RemoveMultipleArticlesUseCase(
	articleRepository
)

export const container = {
	articleController: new ArticleController(
		createArticleUseCase,
		getArticleViewListUseCase,
		getArticleUseCase,
		removeArticleUseCase,
		removeMultipleArticlesUseCase
	),
	authenticationController: new AuthenticationController()
}
