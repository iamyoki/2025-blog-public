export class Article {
	constructor(
		public readonly slug: string,
		public actor: string,
		public title: string,
		public summary: string | undefined,
		public content: string,
		public coverUrl: string | undefined,
		public createdAt: Date,
		public updatedAt: Date | undefined,
		public categories: string[],
		public tags: string[],
		public uploadedImageUrls: string[]
	) {}

	static create(
		slug: string,
		actor: string,
		title: string,
		summary: string | undefined,
		content: string,
		coverUrl: string | undefined,
		categories: string[] = [],
		tags: string[] = [],
		uploadedImageUrls: string[] = []
	): Article {
		const createdAt = new Date()
		return new Article(slug, actor, title, summary, content, coverUrl, createdAt, undefined, categories, tags, uploadedImageUrls)
	}

	update(
		title: string,
		summary: string | undefined,
		content: string,
		coverUrl: string | undefined,
		categories: string[] = [],
		tags: string[] = [],
		uploadedImageUrls: string[] = []
	) {
		const updatedAt = new Date()
		this.title = title
		this.summary = summary
		this.content = content
		this.coverUrl = coverUrl
		this.updatedAt = updatedAt
		this.categories = categories
		this.tags = tags
		this.uploadedImageUrls = uploadedImageUrls
	}
}
