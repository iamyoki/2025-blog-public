'use client'

import { BlogPreview } from '@/components/blog-preview'
import LiquidGrass from '@/components/liquid-grass'
import { useReadArticles } from '@/hooks/use-read-articles'
import { type BlogConfig } from '@/lib/load-blog'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { useParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import useSWR from 'swr'
import { getArticleDetail } from './actions'

type Blog = {
	config: BlogConfig
	markdown: string
	cover?: string
}

export default function Page() {
	const params = useParams() as { id?: string | string[] }
	const slug = Array.isArray(params?.id) ? params.id[0] : params?.id || ''
	const router = useRouter()
	const { markAsRead } = useReadArticles()
	const {
		data,
		isLoading: loading,
		error
	} = useSWR(slug, getArticleDetail, {
		onSuccess: () => {
			markAsRead(slug)
		}
	})

	const errorMessage =
		error &&
		(error instanceof Error ? error.message : 'Unexpected error occurred')

	const blog: Blog | undefined = data && {
		config: {
			title: data.title,
			category: data.categories.join(' '),
			cover: data.coverUrl,
			date: data.createdAt + '',
			summary: data.summary,
			tags: data.tags
		},
		markdown: data.content,
		cover: data.coverUrl
	}

	const title = useMemo(
		() => (blog?.config.title ? blog.config.title : slug),
		[blog?.config.title, slug]
	)
	const date = useMemo(
		() => dayjs(blog?.config.date).format('YYYY年 M月 D日'),
		[blog?.config.date]
	)
	const tags = blog?.config.tags || []

	const handleEdit = () => {
		router.push(`/write/${slug}`)
	}

	if (!slug) {
		return (
			<div className='text-secondary flex h-full items-center justify-center text-sm'>
				无效的链接
			</div>
		)
	}

	if (loading) {
		return (
			<div className='text-secondary flex h-full items-center justify-center text-sm'>
				加载中...
			</div>
		)
	}

	if (errorMessage) {
		return (
			<div className='flex h-full items-center justify-center text-sm text-red-500'>
				{errorMessage}
			</div>
		)
	}

	if (!blog) {
		return (
			<div className='text-secondary flex h-full items-center justify-center text-sm'>
				文章不存在
			</div>
		)
	}

	return (
		<>
			<BlogPreview
				markdown={blog.markdown}
				title={title}
				tags={tags}
				date={date}
				summary={blog.config.summary}
				cover={blog.cover ? `${origin}${blog.cover}` : undefined}
				slug={slug}
			/>

			<motion.button
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={handleEdit}
				className='absolute top-4 right-6 rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80 max-sm:hidden'>
				编辑
			</motion.button>

			{slug === 'liquid-grass' && <LiquidGrass />}
		</>
	)
}
