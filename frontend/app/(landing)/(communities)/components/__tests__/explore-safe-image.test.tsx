import { render, screen } from '@testing-library/react'
import { ExploreSafeImage } from '../explore-safe-image'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, alt = '', ...props }: any) => <img alt={alt} {...props} />,
}))

describe('ExploreSafeImage', () => {
  it('renders the persisted community image immediately', () => {
    render(
      <ExploreSafeImage
        src="https://cdn.example.com/community-cover.jpg"
        fallbackSrc="/placeholder.svg"
        alt="Community cover"
        width={320}
        height={180}
      />,
    )

    expect(screen.getByRole('img', { name: 'Community cover' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/community-cover.jpg',
    )
  })
})
