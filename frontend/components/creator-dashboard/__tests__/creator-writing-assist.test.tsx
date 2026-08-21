import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CreatorWritingAssist } from '../creator-writing-assist'
import { creatorWritingApi } from '@/lib/api/creator-writing.api'

jest.mock('@/app/(creator)/creator/context/creator-community-context', () => ({ useCreatorCommunity: () => ({ selectedCommunityId:'community-1' }) }))
jest.mock('@/lib/api/creator-writing.api', () => ({ creatorWritingApi:{ generate:jest.fn() } }))

describe('CreatorWritingAssist', () => {
  it('previews and applies generated writing', async () => {
    ;(creatorWritingApi.generate as jest.Mock).mockResolvedValue({ content:'A polished description', usage:{ used:1,limit:25,remaining:24 } })
    const onApply=jest.fn()
    render(<CreatorWritingAssist value="" onApply={onApply} surface="course" field="description" context="Course" />)
    fireEvent.click(screen.getByRole('button',{name:/write with ai/i}))
    fireEvent.click(screen.getByRole('button',{name:/generate$/i}))
    expect(await screen.findByText('A polished description')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:/apply suggestion/i}))
    await waitFor(()=>expect(onApply).toHaveBeenCalledWith('A polished description'))
  })
})
