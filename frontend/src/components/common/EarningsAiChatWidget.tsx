import { useMemo, useState } from 'react'
import { anomalyApi } from '../../api/anomalyApi'
import type { ChatAnomalyFlag, ChatHistoryMessage, ShiftSummary } from '../../types/anomaly'

type UiMessageRole = 'assistant' | 'user'

interface UiMessage {
  role: UiMessageRole
  content: string
}

interface EarningsAiChatWidgetProps {
  earningsSummary: ShiftSummary
  anomalies: ChatAnomalyFlag[]
  disabled?: boolean
}

const SUGGESTED_QUESTIONS = [
  'Why did my income drop last month?',
  'Which platform gives me the best hourly rate?',
  'Are my deductions normal?',
  'کیا میری کمائی ٹھیک ہے؟',
]

const INITIAL_ASSISTANT_MESSAGE: UiMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your FairGig earnings assistant. Ask me anything about your income, deductions, or trends. You can ask in English, Urdu, or Roman Urdu.",
}

const toHistory = (messages: UiMessage[]): ChatHistoryMessage[] =>
  messages
    .filter((message) => message.role === 'assistant' || message.role === 'user')
    .map((message) => ({ role: message.role, content: message.content }))

export const EarningsAiChatWidget = ({ earningsSummary, anomalies, disabled = false }: EarningsAiChatWidgetProps) => {
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_ASSISTANT_MESSAGE])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const disableInput = disabled || isLoading

  const canSend = useMemo(() => inputText.trim().length > 0 && !disableInput, [disableInput, inputText])

  const sendMessage = async (messageText?: string) => {
    const question = (messageText ?? inputText).trim()
    if (!question || disableInput) {
      return
    }

    const userMessage: UiMessage = { role: 'user', content: question }
    const withUserMessage = [...messages, userMessage]

    setMessages(withUserMessage)
    setInputText('')
    setIsLoading(true)

    try {
      const response = await anomalyApi.chat({
        question,
        earnings_context: earningsSummary,
        anomalies_context: anomalies,
        conversation_history: toHistory(withUserMessage).slice(-6),
      })

      setMessages((previous) => [...previous, { role: 'assistant', content: response.answer }])
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: "I'm having trouble connecting to the AI right now. Please try again in a moment.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setChatOpen((previous) => !previous)}
        className="fixed bottom-6 right-6 z-60 inline-flex items-center gap-2 rounded-full bg-(--color-button) px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,145,77,0.35)] transition hover:brightness-95"
      >
        <span aria-hidden>💬</span>
        Ask AI
      </button>

      {chatOpen ? (
        <section className="fixed bottom-24 right-4 z-60 flex h-[min(75vh,34rem)] w-[min(95vw,24rem)] flex-col overflow-hidden rounded-2xl border border-[#dfe3ea] bg-white shadow-[0_24px_50px_rgba(16,24,40,0.2)] sm:right-6">
          <header className="flex items-center justify-between border-b border-[#e4e7ec] bg-[#fff5ec] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1d]">FairGig AI Assistant</h3>
              <p className="text-xs text-[#667085]">Ask about your earnings</p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-[#475467] hover:bg-white"
              onClick={() => setChatOpen(false)}
            >
              Close
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8f9fb] p-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6',
                    message.role === 'user'
                      ? 'rounded-br-md bg-(--color-button) text-white'
                      : 'rounded-bl-md bg-white text-[#1d1d1d] shadow-sm',
                  ].join(' ')}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-[#667085] shadow-sm">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-2 border-t border-[#e4e7ec] bg-white px-3 py-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  disabled={disableInput}
                  className="rounded-full border border-[#d6dce6] bg-[#f8f9fb] px-2.5 py-1 text-xs text-[#344054] hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2 border-t border-[#e4e7ec] bg-white p-3">
            <input
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Ask in English, Urdu, or Roman Urdu..."
              disabled={disableInput}
              className="h-10 w-full rounded-xl border border-[#d9dde4] bg-white px-3 text-sm text-[#1d1d1d] outline-none placeholder:text-[#9aa3b2]"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canSend}
              className="h-10 rounded-xl bg-(--color-button) px-3 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </section>
      ) : null}
    </>
  )
}
