import { MediaRepositoryInterface } from '@/core/domain/interfaces/media.repository.interface'

export class GetAllMediaUseCase {
	constructor(private readonly mediaRepository: MediaRepositoryInterface) {}

	async execute() {
		const allMedia = await this.mediaRepository.findAll()
		return allMedia.map(media => ({
			id: media.id,
			path: media.path,
			url: media.url,
			mimeType: media.mimeType,
			size: media.size,
			isImage: media.isImage()
		}))
	}
}
