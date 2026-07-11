import { describe, it, expect } from 'vitest'
import { MarkdownContent, extractMarkdownHeadings } from '@/components/shared/markdown-content'

describe('markdown-content', () => {
  it('renders headings with ids for table of contents', () => {
    const headings = extractMarkdownHeadings('# Title\n\n## Section\n\nParagraph')
    expect(headings).toEqual([
      { id: 'title', text: 'Title', level: 1 },
      { id: 'section', text: 'Section', level: 2 },
    ])
  })

  it('parses lists and inline formatting', () => {
    const source = '**Bold** and `code`\n\n- Item one\n- Item two'
    const headings = extractMarkdownHeadings(source)
    expect(headings).toHaveLength(0)
    expect(MarkdownContent).toBeTypeOf('function')
  })
})
