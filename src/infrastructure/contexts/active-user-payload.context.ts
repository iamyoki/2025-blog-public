import { ActiveUserPayload } from '@/core/common/types/active-user-payload.type'

export const ActiveUserPayloadContext =
	new AsyncLocalStorage<ActiveUserPayload>()
