import { ValidationError } from '@/core/common/errors/validation.error'
import { MediaRepositoryInterface } from '@/core/domain/interfaces/media.repository.interface'

export class UploadMediaUseCase {
	constructor(private readonly mediaRepository: MediaRepositoryInterface) {}

	async execute(file: File) {
		if (file.size > 10 * 1024 * 1024) throw new ValidationError(`File ${file.name} is over 10MB limitation`)
		const media = await this.mediaRepository.upload(file)
		return {
			id: media.id,
			path: media.path,
			url: media.url,
			mimeType: media.mimeType,
			size: media.size,
			isImage: media.isImage()
		}
	}
}
