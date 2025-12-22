import { CreateArticleUseCase } from '@/core/application/use-cases/article/create-article.use-case'
import { GetArticleViewListUseCase } from '@/core/application/use-cases/article/get-article-view-list.use-case'
import { GetArticleUseCase } from '@/core/application/use-cases/article/get-article.use-case'
import { RemoveArticleUseCase } from '@/core/application/use-cases/article/remove-article.use-case'
import { RemoveMultipleArticlesUseCase } from '@/core/application/use-cases/article/remove-multiple-articles.use-case'
import { UnauthorizedError } from '@/core/common/errors/unauthorized.error'
import { ArticleMetaViewModel } from '@/core/domain/view-models/article-meta.view-model'
import { ActiveUserPayloadContext } from '@/infrastructure/contexts/active-user-payload.context'
import * as z from 'zod'

export const ArticleFormSchema = z.object({
	slug: z.string(),
	title: z.string(),
	summary: z.string().optional(),
	content: z.string(),
	coverUrl: z.url().optional(),
	categories: z.string().array(),
	tags: z.string().array()
})

export class ArticleController {
	constructor(
		private readonly createArticleUseCase: CreateArticleUseCase,
		private readonly getArticleViewListUseCase: GetArticleViewListUseCase,
		private readonly getArticleUseCase: GetArticleUseCase,
		private readonly removeArticleUseCase: RemoveArticleUseCase,
		private readonly removeMultipleArticlesUseCase: RemoveMultipleArticlesUseCase
	) {}

	async createArticle(input: z.infer<typeof ArticleFormSchema>) {
		const context = ActiveUserPayloadContext.getStore()
		if (!context) throw new UnauthorizedError('Unauthorized')

		const data = ArticleFormSchema.parse(input)

		await this.createArticleUseCase.execute(
			data.slug,
			context.actor,
			data.title,
			data.summary,
			data.content,
			data.coverUrl,
			data.categories,
			data.tags
		)
	}

	async getArticleMetaList(): Promise<ArticleMetaViewModel[]> {
		return await this.getArticleViewListUseCase.execute()
	}

	async getArticleDetail(slug: string) {
		return await this.getArticleUseCase.execute(slug)
	}

	async removeOneArticle(slug: string): Promise<void> {
		z.parse(z.string(), slug)
		return await this.removeArticleUseCase.execute(slug)
	}

	async removeMultipleArticles(slugs: string[]): Promise<void> {
		z.parse(z.array(z.string()), slugs)
		return await this.removeMultipleArticlesUseCase.execute(slugs)
	}
}
