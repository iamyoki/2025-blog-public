import { useAuthStore } from '@/hooks/use-auth'
import { readFileAsText } from '@/lib/file-utils'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { createArticle } from '../actions'
import { deleteBlog } from '../services/delete-blog'
import { useWriteStore } from '../stores/write-store'

export function usePublish() {
	const { loading, setLoading, form, cover, images, mode, originalSlug } =
		useWriteStore()
	const { isAuth, setPrivateKey } = useAuthStore()

	const onChoosePrivateKey = useCallback(
		async (file: File) => {
			const pem = await readFileAsText(file)
			setPrivateKey(pem)
		},
		[setPrivateKey]
	)

	const onPublish = useCallback(async () => {
		try {
			setLoading(true)
			toast.promise(
				createArticle({
					slug: form.slug,
					title: form.title,
					content: form.md,
					categories: form.category ? [form.category] : [],
					tags: form.tags,
					summary: form.summary
				}),
				{
					loading: mode === 'edit' ? '更新中...' : '发布中...',
					success: mode === 'edit' ? '更新成功' : '发布成功',
					error: mode === 'edit' ? '更新失败' : '发布失败'
				}
			)
			// await pushBlog({
			// 	form,
			// 	cover,
			// 	images,
			// 	mode,
			// 	originalSlug
			// })
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '操作失败')
		} finally {
			setLoading(false)
		}
	}, [form, cover, images, mode, originalSlug, setLoading])

	const onDelete = useCallback(async () => {
		const targetSlug = originalSlug || form.slug
		if (!targetSlug) {
			toast.error('缺少 slug，无法删除')
			return
		}
		try {
			setLoading(true)
			await deleteBlog(targetSlug)
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '删除失败')
		} finally {
			setLoading(false)
		}
	}, [form.slug, originalSlug, setLoading])

	return {
		isAuth,
		loading,
		onChoosePrivateKey,
		onPublish,
		onDelete
	}
}
