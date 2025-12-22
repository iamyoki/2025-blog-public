import { UnauthorizedError } from '@/core/common/errors/unauthorized.error'
import { MediaRepositoryInterface } from '@/core/domain/interfaces/media.repository.interface'
import { Media } from '@/core/domain/models/media/media'
import mime from 'mime'
import { RequestError } from 'octokit'
import { OctokitContext } from '../contexts/octokit.context'

export class MediaRepository implements MediaRepositoryInterface {
	static uploadDir = 'public/media'

	async upload(file: File): Promise<Media> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'

		const [fileBaseName, ext] = file.name.split('.')
		const uniqueFileName = `${fileBaseName}-${crypto.randomUUID()}.${ext}`
		const path = `${MediaRepository.uploadDir}/${uniqueFileName}`

		// file to base64 content
		const buffer = Buffer.from(await file.arrayBuffer())
		const content = buffer.toString('base64')

		// upload
		const { data } = await octokit.rest.repos.createOrUpdateFileContents({
			owner,
			repo,
			path,
			message: `chore(media): upload ${uniqueFileName}`,
			content
		})

		if (!data.content?.download_url) throw new Error('Upload failed')

		// reconcrete media
		return Media.create(
			path,
			path,
			this.generateCdnUrl(path),
			file.type,
			data.content.size ?? file.size
		)
	}

	async findById(id: string): Promise<Media | undefined> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!

		try {
			const { data } = await octokit.rest.repos.getContent({
				owner,
				repo,
				path: id
			})

			if (Array.isArray(data) || data.type !== 'file' || !data.download_url)
				return undefined

			const mimeType = mime.getType(id) || 'application/octet-stream'

			return Media.create(
				data.path,
				data.path,
				this.generateCdnUrl(data.path),
				mimeType,
				data.size
			)
		} catch (error) {
			if (error instanceof RequestError && error.status === 404) {
				return undefined
			}
			throw error
		}
	}

	async findAll(): Promise<Media[]> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'

		try {
			// get ref
			const { data: refData } = await octokit.rest.git.getRef({
				owner,
				repo,
				ref: `heads/${branch}`
			})

			// get root tree
			const { data: rootTreeData } = await octokit.rest.git.getTree({
				owner,
				repo,
				tree_sha: refData.object.sha,
				recursive: 'true'
			})

			// filter only media files
			const mediaFiles = rootTreeData.tree.filter(
				item =>
					item.path.startsWith(MediaRepository.uploadDir) &&
					item.type === 'blob'
			)

			// reconcrete media
			return mediaFiles.map(item =>
				Media.create(
					item.path,
					item.path,
					this.generateCdnUrl(item.path),
					mime.getType(item.path) ?? 'application/octet-stream',
					item.size ?? 0
				)
			)
		} catch (error) {
			console.error(error)
			return []
		}
	}

	private generateCdnUrl(path: string): string {
		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'
		const encodedPath = path.split('/').map(encodeURIComponent).join('/')
		return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${encodedPath}`
	}
}
