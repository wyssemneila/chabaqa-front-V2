import { creatorWritingApi } from '../creator-writing.api'
import { apiClient } from '../client'

jest.mock('../client', () => ({ apiClient:{ post:jest.fn(), get:jest.fn() } }))

it('loads creator writing usage', async () => {
  ;(apiClient.get as jest.Mock).mockResolvedValue({ data:{ success:true, data:{ used:5,limit:25,remaining:20 } } })
  await expect(creatorWritingApi.usage()).resolves.toMatchObject({ used:5, limit:25, remaining:20 })
})
