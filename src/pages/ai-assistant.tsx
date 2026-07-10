import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { askBusinessAssistant } from '@/lib/ai'
import type { AIChatMessage } from '@/types'
import { useTranslation } from '@/contexts/locale-context'

export default function AIAssistantPage() {
  const { t, locale } = useTranslation()
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [t.ai.q1, t.ai.q2, t.ai.q3, t.ai.q4]

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t.ai.welcome,
        timestamp: new Date().toISOString(),
      },
    ])
  }, [locale, t.ai.welcome])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await askBusinessAssistant(text, locale)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title={t.ai.title}
        description={t.ai.description}
      />

      <div className="flex flex-1 gap-6 min-h-0">
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-3xl">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-xl px-4 py-3 max-w-[80%] text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                      <Bot className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="bg-secondary/50 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                      {t.ai.analyzing}
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage(input)
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.ai.placeholder}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="w-72 space-y-4 hidden lg:block">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                {t.ai.suggested}
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-sm rounded-lg bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
