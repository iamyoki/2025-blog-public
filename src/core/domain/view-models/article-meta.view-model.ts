export interface ArticleMetaViewModel {
	slug: string
	actor: string
	title: string
	summary?: string
	coverUrl?: string
	createdAt: Date
	updatedAt?: Date
	categories?: string[]
	tags?: string[]
}
