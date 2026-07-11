import { useMemo, type ReactNode } from 'react'

type Block =
  | { type: 'heading'; level: number; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'hr' }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function inlineFormat(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      )
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, href] = linkMatch
      const external = href.startsWith('http')
      return (
        <a
          key={index}
          href={href}
          className="text-primary underline underline-offset-2 hover:opacity-80"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {label}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2].trim()
      blocks.push({ type: 'heading', level, text, id: slugify(text) })
      index += 1
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    if (line.trim() === '') {
      index += 1
      continue
    }

    const paragraphLines: string[] = [line]
    index += 1
    while (
      index < lines.length
      && lines[index].trim() !== ''
      && !lines[index].startsWith('#')
      && !lines[index].startsWith('```')
      && !/^[-*]\s+/.test(lines[index])
      && !/^\d+\.\s+/.test(lines[index])
      && lines[index].trim() !== '---'
    ) {
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

export function extractMarkdownHeadings(source: string): { id: string; text: string; level: number }[] {
  return parseMarkdown(source)
    .filter((block): block is Extract<Block, { type: 'heading' }> => block.type === 'heading')
    .map(({ id, text, level }) => ({ id, text, level }))
}

interface MarkdownContentProps {
  source: string
  className?: string
}

export function MarkdownContent({ source, className }: MarkdownContentProps) {
  const blocks = useMemo(() => parseMarkdown(source), [source])

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4'
            const size =
              block.level === 1 ? 'text-2xl font-bold mt-8 mb-4 first:mt-0' :
              block.level === 2 ? 'text-xl font-semibold mt-6 mb-3' :
              block.level === 3 ? 'text-lg font-semibold mt-4 mb-2' :
              'text-base font-semibold mt-3 mb-2'
            return (
              <Tag key={index} id={block.id} className={`scroll-mt-20 ${size}`}>
                {inlineFormat(block.text)}
              </Tag>
            )
          }
          case 'paragraph':
            return (
              <p key={index} className="mb-3 leading-relaxed text-foreground/90">
                {inlineFormat(block.text)}
              </p>
            )
          case 'ul':
            return (
              <ul key={index} className="mb-4 ml-5 list-disc space-y-1">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{inlineFormat(item)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={index} className="mb-4 ml-5 list-decimal space-y-1">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{inlineFormat(item)}</li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre
                key={index}
                className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed"
              >
                <code>{block.text}</code>
              </pre>
            )
          case 'hr':
            return <hr key={index} className="my-6 border-border" />
          default:
            return null
        }
      })}
    </div>
  )
}
