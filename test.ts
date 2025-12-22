import z from 'zod'

const Schema = z.object({
	username: z.string()
})

const { error } = Schema.safeParse({ username: 1, age: 2 })
console.log(z.flattenError(error))
