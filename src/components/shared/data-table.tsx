import { cn } from '@/lib/utils'

interface DataTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export function DataTable({ headers, children, className }: DataTableProps) {
  return (
    <div className={cn('glass-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function DataTableRow({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      className={cn(
        'hover:bg-secondary/30 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function DataTableCell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={cn('px-4 py-3 text-sm', className)}>{children}</td>
}
