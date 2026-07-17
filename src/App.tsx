import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronDown,
  ClipboardCheck,
  Cloud,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import { api } from './lib/api'
import type { Health, SourceGroup } from './types'
import { Brand } from './components/Brand'
import { ChatWorkspace } from './components/ChatWorkspace'
import { QuizWorkspace } from './components/QuizWorkspace'
import './styles.css'

type AppTab = 'chat' | 'quiz'

function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="app-loading__mark"><Brand /></div>
      <div className="app-loading__pulse"><span /><span /><span /></div>
      <p>Đang kết nối kho tri thức…</p>
    </div>
  )
}

function ConnectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="connection-error">
      <div className="connection-error__icon"><WifiOff size={31} /></div>
      <span className="eyebrow">Không thể kết nối</span>
      <h1>Backend chưa sẵn sàng</h1>
      <p>{message}</p>
      <button type="button" className="primary-button" onClick={onRetry}>
        <RefreshCw size={16} /> Thử lại
      </button>
      <code>uvicorn app.main:app --reload --port 8000</code>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<AppTab>('chat')
  const [health, setHealth] = useState<Health>()
  const [groups, setGroups] = useState<SourceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [startingLogin, setStartingLogin] = useState(false)

  const loadApp = async () => {
    setLoading(true)
    setError(undefined)
    try {
      // Loading sources is the first real NotebookLM call. Read health after it
      // so the banner reflects any auth rejection/recovery from that call.
      const sourceResponse = await api.sources()
      const healthResponse = await api.health()
      setHealth(healthResponse)
      setGroups(sourceResponse.groups)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải ứng dụng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApp()
  }, [])

  useEffect(() => {
    if (health?.auth.state !== 'logging_in') return
    let cancelled = false
    let timer: number | undefined

    const pollLogin = async () => {
      try {
        const nextHealth = await api.health()
        if (cancelled) return
        setHealth(nextHealth)
        if (nextHealth.auth.state === 'ready') {
          const sourceResponse = await api.sources()
          if (!cancelled) setGroups(sourceResponse.groups)
          return
        }
        if (nextHealth.auth.state === 'logging_in') {
          timer = window.setTimeout(() => void pollLogin(), 1600)
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : 'Không đọc được trạng thái đăng nhập.')
          timer = window.setTimeout(() => void pollLogin(), 2500)
        }
      }
    }

    timer = window.setTimeout(() => void pollLogin(), 900)
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [health?.auth.state])

  const startLogin = async () => {
    setStartingLogin(true)
    setError(undefined)
    try {
      const nextHealth = await api.startLogin()
      setHealth(nextHealth)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Không thể mở đăng nhập Google.')
    } finally {
      setStartingLogin(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (error && !health) return <ConnectionError message={error} onRetry={() => void loadApp()} />
  if (!health) return null

  const sourceCount = groups.reduce(
    (sum, group) => sum + group.sources.filter((source) => source.ready).length,
    0,
  )
  const isLive = health.mode === 'live'
  const isLoggingIn = health.auth.state === 'logging_in'

  return (
    <div className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="app-header">
        <div className="header-inner">
          <Brand />
          <nav className="main-nav" aria-label="Điều hướng chính">
            <button type="button" aria-label="Hỏi đáp" className={tab === 'chat' ? 'is-active' : ''} onClick={() => setTab('chat')}>
              <MessageCircleMore size={17} />
              <span>Hỏi đáp</span>
              {tab === 'chat' && <i />}
            </button>
            <button type="button" aria-label="Luyện đề" className={tab === 'quiz' ? 'is-active' : ''} onClick={() => setTab('quiz')}>
              <ClipboardCheck size={17} />
              <span>Luyện đề</span>
              <b>NEW</b>
              {tab === 'quiz' && <i />}
            </button>
          </nav>
          <div className="header-actions">
            <div className={`connection-pill ${isLive ? 'is-live' : 'is-demo'}`}>
              {isLive ? <Cloud size={14} /> : isLoggingIn ? <LoaderCircle className="spin" size={14} /> : <AlertTriangle size={14} />}
              <span>{isLive ? `${sourceCount} nguồn đã kết nối` : isLoggingIn ? 'Đang đăng nhập' : 'Chế độ demo'}</span>
              <i />
            </div>
            <button
              type="button"
              className="profile-chip"
              onClick={() => void startLogin()}
              disabled={startingLogin || isLoggingIn}
              title="Mở Chromium để đăng nhập hoặc đổi tài khoản Google"
            >
              <div>BS</div>
              <span><strong>Học viên</strong><small>{isLive ? 'Đổi tài khoản' : 'Đăng nhập Google'}</small></span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </header>

      {!isLive && (
        <div className="mode-banner">
          <div>
            {isLoggingIn ? <LoaderCircle className="spin" size={16} /> : <AlertTriangle size={16} />}
            <span><strong>{isLoggingIn ? 'Đang chờ đăng nhập.' : 'Đang dùng dữ liệu demo.'}</strong> {health.auth.message}</span>
          </div>
          <button type="button" onClick={() => void startLogin()} disabled={startingLogin || isLoggingIn}>
            {startingLogin || isLoggingIn ? <LoaderCircle className="spin" size={14} /> : <RefreshCw size={14} />}
            {isLoggingIn ? 'Đang chờ Chromium' : 'Mở đăng nhập Google'}
          </button>
        </div>
      )}

      <main className="app-main">
        {tab === 'chat' ? (
          <ChatWorkspace groups={groups} mode={health.mode} />
        ) : (
          <QuizWorkspace groups={groups} mode={health.mode} />
        )}
      </main>

      <footer className="app-footer">
        <div><Brand compact /><span>© 2026 · Không thay thế tư vấn y khoa.</span></div>
        <div><ShieldCheck size={13} /> Phiên Google chỉ lưu trên máy này <i /> <BookOpenCheck size={13} /> Grounded by NotebookLM</div>
      </footer>

      {error && health && (
        <div className="toast toast--error">
          <AlertTriangle size={16} /><span>{error}</span>
          <button type="button" onClick={() => setError(undefined)}>×</button>
        </div>
      )}
    </div>
  )
}
