import { Article } from '../models/article/article'

export interface ArticleRepositoryInterface {
	save(article: Article): Promise<void>
	findOne(slug: string): Promise<Article | undefined>
	removeOne(slug: string): Promise<void>
	removeBySlugs(slugs: string[]): Promise<void>
}
