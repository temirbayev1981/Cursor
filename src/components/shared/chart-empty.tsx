interface ChartEmptyProps {
  message: string
  height?: number
}

export function ChartEmpty({ message, height = 280 }: ChartEmptyProps) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground rounded-lg border border-dashed border-border"
      style={{ height }}
    >
      {message}
    </div>
  )
}
