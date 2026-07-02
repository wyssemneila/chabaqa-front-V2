import React from 'react'
import { render, screen } from '@testing-library/react'
import { CommunityTestimonials } from '@/app/(landing)/community/[slug]/components/community-testimonials'

describe('CommunityTestimonials', () => {
  it('renders nothing when CMS testimonials are empty', () => {
    const { container } = render(
      <CommunityTestimonials
        community={{ name: 'Test Community', category: 'Education' }}
        testimonialsContent={{ testimonials: [], visible: true }}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
