import { useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  BookOpenCheck,
  Bot,
  Braces,
  ChevronDown,
  CircleStop,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Quote,
  RotateCcw,
  Sparkles,
  UserRound,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { api } from '../lib/api'
import type { Citation, GroupId, SourceGroup } from '../types'
import { SourceSelector } from './SourceSelector'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  error?: boolean
}

const suggestions = [
  {
    icon: Braces,
    title: 'Hệ thống hóa kiến thức',
    prompt: 'Hãy hệ thống hóa các bước khám và định khu tổn thương thần kinh theo dạng dễ nhớ.',
  },
  {
    icon: MessageSquareText,
    title: 'So sánh chẩn đoán',
    prompt: 'So sánh các dấu hiệu giúp phân biệt tổn thương trung ương và ngoại biên.',
  },
  {
    icon: BookOpenCheck,
    title: 'Ôn nhanh trước thi',
    prompt: 'Tóm tắt những điểm dễ nhầm và thường được hỏi trong đề thi.',
  },
]

interface ChatWorkspaceProps {
  groups: SourceGroup[]
  mode: 'live' | 'demo'
}

function CitationList({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)
  if (!citations.length) return null
  return (
    <div className={`citations ${open ? 'is-open' : ''}`}>
      <button type="button" className="citations__trigger" onClick={() => setOpen(!open)}>
        <Quote size={14} />
        {citations.length} nguồn tham chiếu
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="citations__list">
          {citations.map((citation) => (
            <div className="citation" key={`${citation.number}-${citation.source_id}`}>
              <span>{citation.number}</span>
              <div>
                <strong>{citation.source_title}</strong>
                {citation.excerpt && <p>{citation.excerpt}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChatWorkspace({ groups, mode }: ChatWorkspaceProps) {
  const [selectedGroups, setSelectedGroups] = useState<GroupId[]>(['main'])
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const selectedLabels = useMemo(
    () => groups.filter((group) => selectedGroups.includes(group.id)).map((group) => group.label),
    [groups, selectedGroups],
  )

  const clearChat = () => {
    setMessages([])
    setConversationId(undefined)
    setDraft('')
    inputRef.current?.focus()
  }

  const send = async (override?: string) => {
    const content = (override ?? draft).trim()
    if (!content || loading) return
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content }
    setMessages((current) => [...current, userMessage])
    setDraft('')
    setLoading(true)
    try {
      const response = await api.chat(content, selectedGroups, conversationId)
      setConversationId(response.conversation_id || conversationId)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          citations: response.citations,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Không thể kết nối NotebookLM.',
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  return (
    <section className="workspace chat-workspace">
      <aside className="source-sidebar glass-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Kho tri thức</span>
            <h2>Chọn nguồn hỏi</h2>
          </div>
          <span className="selected-badge">{selectedGroups.length}/4</span>
        </div>
        <p className="panel-hint">Bot chỉ dùng nội dung trong những nhóm bạn đánh dấu.</p>
        <SourceSelector groups={groups} selected={selectedGroups} onChange={setSelectedGroups} />
        <div className="grounding-note">
          <Sparkles size={17} />
          <div>
            <strong>Grounded by NotebookLM</strong>
            <span>Phản hồi kèm trích dẫn theo đúng source</span>
          </div>
        </div>
      </aside>

      <div className="chat-panel glass-panel">
        <header className="chat-header">
          <div className="chat-agent">
            <div className="chat-agent__avatar"><Bot size={21} /></div>
            <div>
              <div className="chat-agent__name">Ôn thi cùng Tú</div>
              <div className="chat-agent__status">
                <span /> {mode === 'live' ? 'NotebookLM đã kết nối' : 'Đang ở chế độ demo'}
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button type="button" className="ghost-button" onClick={clearChat}>
              <Plus size={15} /> Cuộc trò chuyện mới
            </button>
          )}
        </header>

        <div className="chat-scroll" aria-live="polite">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="orb orb--chat"><MessageSquareText size={31} /></div>
              <span className="eyebrow">Hỏi sâu · Hiểu chắc</span>
              <h1>Bạn muốn khám phá điều gì?</h1>
              <p>
                Đặt câu hỏi tự nhiên. Mình sẽ tìm trong <strong>{selectedLabels.join(', ')}</strong>
                {' '}và trả lời có căn cứ.
              </p>
              <div className="suggestion-grid">
                {suggestions.map(({ icon: Icon, title, prompt }) => (
                  <button type="button" key={title} onClick={() => void send(prompt)}>
                    <Icon size={17} />
                    <span>{title}</span>
                    <small>{prompt}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message message--${message.role} ${message.error ? 'is-error' : ''}`} key={message.id}>
                  <div className="message__avatar">
                    {message.role === 'assistant' ? <Bot size={17} /> : <UserRound size={17} />}
                  </div>
                  <div className="message__body">
                    <div className="message__meta">
                      {message.role === 'assistant' ? 'Ôn thi cùng Tú' : 'Bạn'}
                    </div>
                    <div className="markdown-body">
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                    {message.citations && <CitationList citations={message.citations} />}
                  </div>
                </article>
              ))}
              {loading && (
                <article className="message message--assistant">
                  <div className="message__avatar"><Bot size={17} /></div>
                  <div className="message__body">
                    <div className="message__meta">Ôn thi cùng Tú</div>
                    <div className="thinking">
                      <LoaderCircle size={16} className="spin" />
                      Đang đọc {selectedGroups.length} nhóm tài liệu…
                      <span><i /><i /><i /></span>
                    </div>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <div className="selected-source-pills">
            <FileText size={13} />
            {selectedLabels.map((label) => <span key={label}>{label}</span>)}
          </div>
          <div className="composer">
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              placeholder="Hỏi bất kỳ điều gì trong tài liệu…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
            />
            <button
              type="button"
              className="send-button"
              onClick={() => void send()}
              disabled={!draft.trim() || loading}
              aria-label={loading ? 'Đang gửi' : 'Gửi câu hỏi'}
            >
              {loading ? <CircleStop size={18} /> : <ArrowUp size={19} />}
            </button>
          </div>
          <div className="composer-footnote">
            <span>Enter để gửi · Shift + Enter để xuống dòng</span>
            {conversationId && <span><RotateCcw size={11} /> Đã ghi nhớ ngữ cảnh</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
