import { UnauthorizedError } from '@/core/common/errors/unauthorized.error'
import { ArticleRepositoryInterface } from '@/core/domain/interfaces/article.repository.interface'
import { Article } from '@/core/domain/models/article/article'
import { RequestError } from 'octokit'
import { OctokitContext } from '../contexts/octokit.context'

export type MetaItem = {
	slug: string
	actor: string
	title: string
	summary: string | undefined
	coverUrl: string | undefined
	createdAt: Date
	updatedAt: Date | undefined
	categories: string[]
	tags: string[]
	uploadedImageUrls: string[]
}

export class ArticleRepository implements ArticleRepositoryInterface {
	/**
	 * - 获取请求上下文的token
	 * - 实例化octokit
	 * - 获取/public/meta.json元数据文件
	 * - 修改meta.json, 存放article的slug, summary, coverUrl...相关元信息
	 * - 创建文章blob, 创建meta.json blob
	 * - 创建tree
	 * - 创建commit
	 * - 修改ref
	 */
	async save(article: Article): Promise<void> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'

		// get ref
		const { data: refData } = await octokit.rest.git.getRef({
			owner,
			repo,
			ref: `heads/${branch}`
		})
		const latestCommitSha = refData.object.sha

		// get root tree
		const { data: rootTreeData } = await octokit.rest.git.getTree({
			owner,
			repo,
			tree_sha: latestCommitSha
		})

		// get public dir sha
		const publicSha = rootTreeData.tree.find(
			item => item.mode === '040000' && item.path === 'public'
		)?.sha

		// find public/meta.json sha
		let metaSha: string | undefined
		if (publicSha) {
			try {
				const { data: publicTreeData } = await octokit.rest.git.getTree({
					owner,
					repo,
					tree_sha: publicSha
				})
				metaSha = publicTreeData.tree.find(
					item => item.path === 'meta.json'
				)?.sha
			} catch (error) {
				if (error instanceof RequestError) {
				} else throw error
			}
		}

		// get meta data
		let meta: MetaItem[] = []
		if (metaSha) {
			try {
				const { data: metaBlobData } = await octokit.rest.git.getBlob({
					owner,
					repo,
					file_sha: metaSha
				})
				meta = JSON.parse(
					Buffer.from(metaBlobData.content, 'base64').toString('utf8')
				)
			} catch (error) {
				if (error instanceof RequestError) {
				} else throw error
			}
		}

		// update meta data
		const newMetaItem: MetaItem = {
			slug: article.slug,
			actor: article.actor,
			title: article.title,
			summary: article.summary,
			coverUrl: article.coverUrl,
			createdAt: article.createdAt,
			updatedAt: article.updatedAt,
			categories: article.categories,
			tags: article.tags,
			uploadedImageUrls: article.uploadedImageUrls
		}
		const existingIndex = meta.findIndex(item => item.slug === newMetaItem.slug)
		if (existingIndex > -1) {
			meta[existingIndex] = newMetaItem
		} else {
			meta.unshift(newMetaItem)
		}

		// create meta blob
		const metaBlobPromise = octokit.rest.git.createBlob({
			owner,
			repo,
			content: JSON.stringify(meta),
			encoding: 'utf-8'
		})

		// create content markdown blob
		const contentBlobPromise = octokit.rest.git.createBlob({
			owner,
			repo,
			content: article.content,
			encoding: 'utf-8'
		})

		const [metaRes, contentRes] = await Promise.all([
			metaBlobPromise,
			contentBlobPromise
		])

		// create new tree
		const { data: newTreeData } = await octokit.rest.git.createTree({
			owner,
			repo,
			base_tree: rootTreeData.sha,
			tree: [
				{
					path: 'public/meta.json',
					mode: '100644',
					type: 'blob',
					sha: metaRes.data.sha
				},
				{
					path: `public/blog/${article.slug}/index.md`,
					mode: '100644',
					type: 'blob',
					sha: contentRes.data.sha
				}
			]
		})

		// commit
		const { data: newCommitData } = await octokit.rest.git.createCommit({
			owner,
			repo,
			message: `chore(blog): ${existingIndex > -1 ? 'update' : 'create'} blog "${article.slug}"`,
			tree: newTreeData.sha,
			parents: [latestCommitSha]
		})

		// update ref
		await octokit.rest.git.updateRef({
			owner,
			repo,
			ref: `heads/${branch}`,
			sha: newCommitData.sha
		})
	}

	async findOne(slug: string): Promise<Article | undefined> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const blogPath = `public/blog/${slug}/index.md`

		try {
			// get content
			const { data: contentData } = await octokit.rest.repos.getContent({
				owner,
				repo,
				path: blogPath
			})
			if (Array.isArray(contentData)) return undefined
			if (contentData.type !== 'file') return undefined
			const content = Buffer.from(contentData.content, 'base64').toString(
				'utf8'
			)

			// get meta
			const { data: metaData } = await octokit.rest.repos.getContent({
				owner,
				repo,
				path: 'public/meta.json'
			})
			if (Array.isArray(metaData)) return undefined
			if (metaData.type !== 'file') return undefined
			const meta: MetaItem[] = JSON.parse(
				Buffer.from(metaData.content, 'base64').toString('utf8')
			)
			const metaItem = meta.find(item => item.slug === slug)
			if (!metaItem) return undefined

			// reconcrete article
			const article = new Article(
				slug,
				metaItem.actor,
				metaItem.title,
				metaItem.summary,
				content,
				metaItem.coverUrl,
				metaItem.createdAt,
				metaItem.updatedAt,
				metaItem.categories,
				metaItem.tags,
				metaItem.uploadedImageUrls
			)
			return article
		} catch (error) {
			if (error instanceof RequestError && error.status === 404) {
				return undefined
			}
			console.error(error)
			throw error
		}
	}

	// 软删除
	async removeOne(slug: string): Promise<void> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'
		const metaPath = `public/meta.json`

		const { data: metaData } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path: metaPath,
			ref: branch
		})
		if (Array.isArray(metaData)) return undefined
		if (metaData.type !== 'file') return undefined
		const meta: MetaItem[] = JSON.parse(
			Buffer.from(metaData.content, 'base64').toString('utf8')
		)
		const newMeta: MetaItem[] = meta.filter(item => item.slug !== slug)

		if (meta.length !== newMeta.length) {
			const newMetaContent = Buffer.from(JSON.stringify(newMeta)).toString(
				'base64'
			)
			await octokit.rest.repos.createOrUpdateFileContents({
				owner,
				repo,
				path: metaPath,
				message: `chore(blog): unlist article "${slug}" from meta`,
				content: newMetaContent,
				sha: metaData.sha,
				branch
			})
		}
	}

	// 软删除
	async removeBySlugs(slugs: string[]): Promise<void> {
		const octokit = OctokitContext.getStore()
		if (!octokit) throw new UnauthorizedError()

		const owner = process.env.GITHUB_OWNER!
		const repo = process.env.GITHUB_REPO!
		const branch = process.env.GITHUB_BRANCH! ?? 'main'
		const metaPath = `public/meta.json`

		const { data: metaData } = await octokit.rest.repos.getContent({
			owner,
			repo,
			path: metaPath,
			ref: branch
		})
		if (Array.isArray(metaData)) return undefined
		if (metaData.type !== 'file') return undefined
		const meta: MetaItem[] = JSON.parse(
			Buffer.from(metaData.content, 'base64').toString('utf8')
		)
		const newMeta: MetaItem[] = meta.filter(item => !slugs.includes(item.slug))

		if (meta.length !== newMeta.length) {
			const newMetaContent = Buffer.from(JSON.stringify(newMeta)).toString(
				'base64'
			)
			await octokit.rest.repos.createOrUpdateFileContents({
				owner,
				repo,
				path: metaPath,
				message: `chore(blog): unlist multiple ${slugs.length} articles from meta`,
				content: newMetaContent,
				sha: metaData.sha,
				branch
			})
		}
	}
}
