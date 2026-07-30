import { render, screen } from '@testing-library/react'
import { YouTubeVideos } from '../youtube-videos'

jest.mock('next-intl', () => ({
  useTranslations: () => Object.assign((key: string) => key, {
    raw: () => Array.from({ length: 6 }, (_, index) => ({
      num: `0${index + 1}`,
      tag: 'Courses',
      title: `Video ${index + 1}`,
      desc: `Description ${index + 1}`,
    })),
  }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, alt = '', ...props }: any) => <img alt={alt} {...props} />,
}))

jest.mock('@/components/ui/infinite-slider', () => ({
  InfiniteSlider: ({ children, duration, durationOnHover }: any) => (
    <div data-testid="infinite-slider" data-duration={duration} data-hover-duration={durationOnHover}>
      {children}
      <div aria-hidden="true">{children}</div>
    </div>
  ),
}))

describe('YouTubeVideos', () => {
  it('uses a continuous infinite slider with slower hover motion', () => {
    render(<YouTubeVideos />)
    const slider = screen.getByTestId('infinite-slider')
    expect(slider).toHaveAttribute('data-duration', '42')
    expect(slider).toHaveAttribute('data-hover-duration', '90')
  })

  it('duplicates tutorial cards for a seamless loop', () => {
    render(<YouTubeVideos />)
    expect(screen.getAllByText('Video 1')).toHaveLength(2)
  })
})
