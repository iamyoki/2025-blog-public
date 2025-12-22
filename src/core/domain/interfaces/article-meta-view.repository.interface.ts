import { ArticleMetaViewModel } from '../view-models/article-meta.view-model'

export interface ArticleMetaViewRepositoryInterface {
	findOne(slug: string): Promise<ArticleMetaViewModel | undefined>
	findAll(): Promise<ArticleMetaViewModel[]>
}
