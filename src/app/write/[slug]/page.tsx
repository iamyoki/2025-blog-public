'use client'

import { getArticleDetail } from '@/app/blog/[id]/actions'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { WriteActions } from '../components/actions'
import { WriteEditor } from '../components/editor'
import { WritePreview } from '../components/preview'
import { WriteSidebar } from '../components/sidebar'
import { usePreviewStore } from '../stores/preview-store'
import { PublishForm } from '../types'

export default function EditBlogPage() {
	const params = useParams() as { slug?: string }
	const slug = params?.slug || ''

	const { data, isLoading: loading, error } = useSWR(slug, getArticleDetail)

	const form: PublishForm | undefined = data && {
		slug: data.slug,
		title: data.title,
		md: data.content,
		tags: data.tags,
		date: data.createdAt + '',
		summary: data.summary ?? ''
	}

	const { isPreview, closePreview } = usePreviewStore()

	const coverPreviewUrl = data?.coverUrl ?? null

	if (loading) {
		return (
			<div className='text-secondary flex h-screen items-center justify-center text-sm'>
				加载中...
			</div>
		)
	}

	if (!slug) {
		return (
			<div className='flex h-screen items-center justify-center text-sm text-red-500'>
				无效的博客 ID
			</div>
		)
	}

	if (!form) return null

	return isPreview ? (
		<WritePreview
			form={form}
			coverPreviewUrl={coverPreviewUrl}
			onClose={closePreview}
			slug={slug}
		/>
	) : (
		<>
			<div className='flex h-full justify-center gap-6 px-6 pt-24 pb-12'>
				<WriteEditor form={form} />
				<WriteSidebar />
			</div>

			<WriteActions />
		</>
	)
}
