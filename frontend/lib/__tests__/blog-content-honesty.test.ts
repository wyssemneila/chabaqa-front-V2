import { getAllBlogPosts } from '@/lib/blog-content'

describe('blog-content honesty audit', () => {
  it('does not contain unsourced Chabaqa-specific performance percentages', () => {
    const posts = getAllBlogPosts()
    const combined = posts.map((post) => `${post.content} ${post.arContent || ''}`).join('\n')

    expect(combined).not.toMatch(/Chabaqa.*\d+%/i)
    expect(combined).not.toMatch(/on Chabaqa range from \d+/i)
    expect(combined).not.toMatch(/Chabaqa courses using/i)
  })
})
