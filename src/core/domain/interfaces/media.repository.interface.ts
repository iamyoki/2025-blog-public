import { Media } from '../models/media/media'

export interface MediaRepositoryInterface {
	upload(file: File): Promise<Media>
	findById(id: string): Promise<Media | undefined>
	findAll(): Promise<Media[]>
}
