export class Media {
	constructor(
		public readonly id: string,
		public readonly path: string,
		public readonly url: string,
		public readonly mimeType: string,
		public readonly size: number
	) {}

	static create(id: string, path: string, url: string, mimeType: string, size: number): Media {
		return new Media(id, path, url, mimeType, size)
	}

	isImage(): boolean {
		return this.mimeType.startsWith('image')
	}
}
