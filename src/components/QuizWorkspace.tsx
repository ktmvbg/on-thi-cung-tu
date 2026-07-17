import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Database,
  FileQuestion,
  Flag,
  Gauge,
  LoaderCircle,
  Layers3,
  Medal,
  Pause,
  Play,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  Trash2,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { api } from '../lib/api'
import { calculateResult, formatTime } from '../lib/quiz'
import type {
  Difficulty,
  ExamBank,
  ExamProgress,
  QuizJob,
  QuizQuestion,
  QuizSettings,
  SourceGroup,
  StoredExamSummary,
} from '../types'

type QuizPhase = 'setup' | 'generating' | 'exam' | 'result'
type ReviewFilter = 'all' | 'incorrect' | 'flagged'

const defaultSettings: QuizSettings = {
  question_count: 200,
  difficulty: 'hard',
  duration_minutes: 90,
  group_ids: ['main', 'supplement_1', 'supplement_2'],
}

const difficultyOptions: Array<{
  id: Difficulty
  label: string
  description: string
  icon: typeof Gauge
}> = [
  { id: 'easy', label: 'Cơ bản', description: 'Ghi nhớ trọng tâm', icon: BookOpenCheck },
  { id: 'medium', label: 'Khá', description: 'Liên hệ & phân biệt', icon: Target },
  { id: 'hard', label: 'Chuyên sâu', description: 'Suy luận như đề thật', icon: Zap },
]

const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Cơ bản',
  medium: 'Khá',
  hard: 'Chuyên sâu',
}

const formatStoredDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value))

interface QuizWorkspaceProps {
  groups: SourceGroup[]
  mode: 'live' | 'demo'
}

function SettingStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock3
  value: string
  label: string
}) {
  return (
    <div className="setting-stat">
      <Icon size={18} />
      <div><strong>{value}</strong><span>{label}</span></div>
    </div>
  )
}

function QuizSetup({
  settings,
  setSettings,
  onGenerate,
  mode,
  bank,
  bankBusy,
  pregenerateCount,
  setPregenerateCount,
  onPregenerate,
  onUseStored,
  onDeleteStored,
}: {
  settings: QuizSettings
  setSettings: (settings: QuizSettings) => void
  onGenerate: () => void
  mode: 'live' | 'demo'
  bank?: ExamBank
  bankBusy: boolean
  pregenerateCount: number
  setPregenerateCount: (count: number) => void
  onPregenerate: () => void
  onUseStored: (exam: StoredExamSummary) => void
  onDeleteStored: (exam: StoredExamSummary) => void
}) {
  return (
    <div className="quiz-setup">
      <section className="quiz-hero glass-panel">
        <div className="quiz-hero__glow" />
        <div className="quiz-hero__content">
          <div className="quiz-hero__icon"><BrainCircuit size={31} /></div>
          <span className="eyebrow"><Sparkles size={13} /> Luyện đề cùng Tú</span>
          <h1>Sẵn sàng cho một<br /><em>ca trực trí tuệ?</em></h1>
          <p>
            70% theo vùng trọng tâm, 30% case lâm sàng nâng cao; kiến thức được cân đúng 80/20 giữa sách chính và sách phụ.
          </p>
          <div className="quiz-default-stats">
            <SettingStat icon={FileQuestion} value={`${settings.question_count}`} label="câu hỏi" />
            <SettingStat icon={Clock3} value={`${settings.duration_minutes}’`} label="thời gian" />
            <SettingStat icon={Gauge} value={difficultyLabel[settings.difficulty]} label="độ khó" />
          </div>
          <button type="button" className="primary-button primary-button--large" onClick={onGenerate}>
            <Play size={18} fill="currentColor" /> Tạo đề & bắt đầu
            <ArrowRight size={18} />
          </button>
          <div className="quiz-hero__trust">
            <ShieldCheck size={14} />
            {mode === 'live'
              ? settings.question_count === 200
                ? '5 batch tuần tự × 40 câu · dùng chung 1 conversation'
                : 'Mỗi batch NotebookLM Chat tối đa 40 câu, chạy tuần tự'
              : 'Dữ liệu demo để trải nghiệm giao diện'}
          </div>
        </div>
        <div className="quiz-hero__visual" aria-hidden="true">
          <div className="brain-rings"><span /><span /><span /></div>
          <BrainCircuit size={106} strokeWidth={1.05} />
          <div className="floating-chip floating-chip--one"><CheckCircle2 size={15} /> 70% khoanh vùng</div>
          <div className="floating-chip floating-chip--two"><Zap size={15} /> 30% case ×2</div>
          <div className="floating-chip floating-chip--three"><BookOpenCheck size={15} /> 80/20 nguồn</div>
        </div>
      </section>

      <aside className="quiz-settings glass-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Tùy chỉnh</span><h2>Cấu hình đề thi</h2></div>
          <Settings2 size={19} />
        </div>

        <div className="setting-block">
          <div className="setting-label">
            <span><FileQuestion size={15} /> Số câu hỏi</span>
            <strong>{settings.question_count}</strong>
          </div>
          <input
            className="range-input"
            type="range"
            min="10"
            max="200"
            step="10"
            value={settings.question_count}
            style={{ '--range-progress': `${((settings.question_count - 10) / 190) * 100}%` } as React.CSSProperties}
            onChange={(event) => setSettings({ ...settings, question_count: Number(event.target.value) })}
          />
          <div className="preset-row">
            {[50, 100, 150, 200].map((count) => (
              <button
                type="button"
                key={count}
                className={settings.question_count === count ? 'is-active' : ''}
                onClick={() => setSettings({ ...settings, question_count: count })}
              >{count}</button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <div className="setting-label"><span><Gauge size={15} /> Độ khó</span></div>
          <div className="difficulty-grid">
            {difficultyOptions.map(({ id, label, description, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={settings.difficulty === id ? 'is-active' : ''}
                onClick={() => setSettings({ ...settings, difficulty: id })}
              >
                <span><Icon size={17} /></span>
                <strong>{label}</strong>
                <small>{description}</small>
                {settings.difficulty === id && <Check size={13} className="difficulty-check" />}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <div className="setting-label">
            <span><Clock3 size={15} /> Thời gian</span>
            <strong>{settings.duration_minutes} phút</strong>
          </div>
          <input
            className="range-input range-input--gold"
            type="range"
            min="15"
            max="180"
            step="5"
            value={settings.duration_minutes}
            style={{ '--range-progress': `${((settings.duration_minutes - 15) / 165) * 100}%` } as React.CSSProperties}
            onChange={(event) => setSettings({ ...settings, duration_minutes: Number(event.target.value) })}
          />
          <div className="preset-row">
            {[30, 60, 90, 120].map((duration) => (
              <button
                type="button"
                key={duration}
                className={settings.duration_minutes === duration ? 'is-active' : ''}
                onClick={() => setSettings({ ...settings, duration_minutes: duration })}
              >{duration}’</button>
            ))}
          </div>
        </div>

        <div className="quiz-recipe">
          <div className="quiz-recipe__heading"><BrainCircuit size={16} /><strong>Công thức ra đề</strong><span>Đã khóa</span></div>
          <div className="quiz-recipe__row">
            <div><strong>70%</strong><span>Dạng Khoanh vùng</span></div>
            <i />
            <div><strong>30%</strong><span>Case lâm sàng ×2 khó</span></div>
          </div>
          <div className="quiz-recipe__source">
            <span><b>80%</b> Sách chính</span>
            <span><b>10%</b> Sách phụ 1</span>
            <span><b>10%</b> Sách phụ 2</span>
          </div>
          <div className="quiz-recipe__coverage">
            <CheckCircle2 size={12} /> Phủ đủ 7/7 mục Khoanh vùng
            <b>{settings.question_count === 200 ? '20 câu mỗi mục' : 'chia đều theo số câu'}</b>
          </div>
          <div className="quiz-recipe__coverage">
            <Sparkles size={12} /> Sáng tạo cao nhưng vẫn bám nguồn
            <b>{settings.question_count === 200 ? '1 batch · 40 câu' : '20% số batch'}</b>
          </div>
        </div>
      </aside>

      <section className="exam-bank glass-panel">
        <div className="exam-bank__header">
          <div>
            <span className="eyebrow"><Database size={13} /> Database đề thi</span>
            <h2>Kho đề tạo sẵn</h2>
            <p>Tạo trước tối đa 10 bộ. Đề hoàn tất được lưu trong máy và mở ngay, không phải chờ NotebookLM.</p>
          </div>
          <div className="exam-bank__capacity">
            <strong>{bank?.used_slots ?? 0}/{bank?.max_sets ?? 10}</strong>
            <span>đã dùng</span>
          </div>
        </div>

        <div className="exam-bank__actions">
          <div className="bank-stepper">
            <button type="button" onClick={() => setPregenerateCount(Math.max(1, pregenerateCount - 1))}>−</button>
            <div><strong>{pregenerateCount}</strong><span>bộ đề</span></div>
            <button
              type="button"
              onClick={() => setPregenerateCount(Math.min(bank?.available_slots ?? 10, pregenerateCount + 1))}
            >+</button>
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={bankBusy || !bank?.available_slots}
            onClick={onPregenerate}
          >
            {bankBusy ? <LoaderCircle size={16} className="spin" /> : <Layers3 size={16} />}
            Chạy trước {pregenerateCount} bộ
          </button>
          <span>Các bộ được tạo lần lượt để giữ ổn định một conversation riêng cho từng đề.</span>
        </div>

        <div className="exam-bank__list">
          {!bank?.exams.length && (
            <div className="bank-empty"><Database size={22} /><span>Chưa có đề lưu sẵn</span></div>
          )}
          {bank?.exams.map((exam, index) => (
            <article className={`bank-card bank-card--${exam.status}`} key={exam.id}>
              <div className="bank-card__number">#{bank.exams.length - index}</div>
              <div className="bank-card__copy">
                <strong>{exam.question_count} câu · {difficultyLabel[exam.difficulty]} · {exam.duration_minutes} phút</strong>
                <span>{exam.message}</span>
                <small>
                  {formatStoredDate(exam.updated_at)} · còn {formatTime(exam.remaining_seconds)} · {exam.answered_count}/{exam.question_count} câu
                </small>
                {(exam.status === 'generating' || exam.status === 'in_progress') && (
                  <div><i style={{ width: `${exam.progress}%` }} /></div>
                )}
              </div>
              <span className="bank-card__status">
                {exam.status === 'ready' && <><CheckCircle2 size={14} /> Sẵn sàng</>}
                {exam.status === 'generating' && <><LoaderCircle size={14} className="spin" /> {exam.progress}%</>}
                {exam.status === 'queued' && <><Clock3 size={14} /> Chờ</>}
                {exam.status === 'in_progress' && <><Play size={14} /> Đang làm</>}
                {exam.status === 'completed' && <><BadgeCheck size={14} /> Đã xong</>}
                {exam.status === 'error' && <><AlertTriangle size={14} /> Lỗi</>}
              </span>
              {(exam.status === 'ready' || exam.status === 'in_progress') && (
                <button type="button" className="bank-use" onClick={() => onUseStored(exam)}>
                  <Play size={14} fill="currentColor" /> {exam.status === 'in_progress' ? 'Làm tiếp' : 'Làm đề'}
                </button>
              )}
              {exam.status !== 'generating' && (
                <button type="button" className="bank-delete" aria-label="Xóa bộ đề" onClick={() => onDeleteStored(exam)}>
                  <Trash2 size={14} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function QuizGenerating({ job, onCancel }: { job: QuizJob; onCancel: () => void }) {
  return (
    <div className="generation-screen glass-panel">
      <div className="generation-orbit">
        <div className="generation-orbit__ring" />
        <div className="generation-orbit__ring generation-orbit__ring--two" />
        <BrainCircuit size={47} />
        <span>{job.progress}%</span>
      </div>
      <span className="eyebrow"><Sparkles size={13} /> NotebookLM đang biên soạn</span>
      <h1>Đang tạo đề dành riêng cho bạn</h1>
      <p>{job.message}</p>
      <div className="generation-progress"><span style={{ width: `${job.progress}%` }} /></div>
      <div className="generation-steps">
        <span className="is-done"><CheckCircle2 size={15} /> Kết nối nguồn</span>
        <span className={job.progress > 20 ? 'is-active' : ''}>
          <LoaderCircle size={15} /> {job.question_count === 200 ? '5 batch × 40 câu · cùng 1 conversation' : 'Các batch Chat ≤ 40 câu'}
        </span>
        <span className={job.progress > 75 ? 'is-active' : ''}><BadgeCheck size={15} /> NotebookLM tự tránh lặp qua lịch sử</span>
      </div>
      <button type="button" className="ghost-button" onClick={onCancel}><X size={15} /> Hủy tạo đề</button>
    </div>
  )
}

function SubmitDialog({
  answered,
  total,
  onClose,
  onSubmit,
}: {
  answered: number
  total: number
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="submit-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Đóng"><X size={17} /></button>
        <div className="dialog-icon"><Send size={25} /></div>
        <h2>Nộp bài ngay?</h2>
        <p>Bạn đã trả lời <strong>{answered}/{total}</strong> câu. Sau khi nộp, đáp án không thể thay đổi.</p>
        {answered < total && (
          <div className="dialog-warning"><AlertTriangle size={16} /> Còn {total - answered} câu chưa trả lời</div>
        )}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Kiểm tra lại</button>
          <button type="button" className="primary-button" onClick={onSubmit}>Nộp bài</button>
        </div>
      </div>
    </div>
  )
}

function QuizExam({
  questions,
  settings,
  initialProgress,
  onProgress,
  onFinish,
}: {
  questions: QuizQuestion[]
  settings: QuizSettings
  initialProgress?: ExamProgress
  onProgress: (progress: ExamProgress) => void
  onFinish: (
    answers: Record<string, number>,
    flags: Set<string>,
    elapsed: number,
    remaining: number,
  ) => void
}) {
  const totalSeconds = settings.duration_minutes * 60
  const [remaining, setRemaining] = useState(
    Math.min(totalSeconds, initialProgress?.remaining_seconds ?? totalSeconds),
  )
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(questions.length - 1, initialProgress?.current_index ?? 0),
  )
  const [answers, setAnswers] = useState<Record<string, number>>(initialProgress?.answers ?? {})
  const [flags, setFlags] = useState<Set<string>>(new Set(initialProgress?.flags ?? []))
  const [paused, setPaused] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const current = questions[currentIndex]
  const answeredCount = Object.keys(answers).length

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          onFinish(answers, flags, totalSeconds, 0)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [paused, answers, flags, onFinish, totalSeconds])

  useEffect(() => {
    if (remaining % 5 !== 0) return
    onProgress({
      remaining_seconds: remaining,
      current_index: currentIndex,
      answers,
      flags: [...flags],
    })
  }, [remaining, currentIndex, answers, flags, onProgress])

  useEffect(() => {
    const save = window.setTimeout(() => {
      onProgress({
        remaining_seconds: remaining,
        current_index: currentIndex,
        answers,
        flags: [...flags],
      })
    }, 450)
    return () => window.clearTimeout(save)
  }, [currentIndex, answers, flags, onProgress])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key >= '1' && event.key <= '4') {
        const option = Number(event.key) - 1
        setAnswers((value) => ({ ...value, [current.id]: option }))
      }
      if (event.key === 'ArrowRight' && currentIndex < questions.length - 1) setCurrentIndex((value) => value + 1)
      if (event.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex((value) => value - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [current.id, currentIndex, questions.length])

  const toggleFlag = () => {
    setFlags((currentFlags) => {
      const next = new Set(currentFlags)
      if (next.has(current.id)) next.delete(current.id)
      else next.add(current.id)
      return next
    })
  }

  const timerDanger = remaining <= 300

  return (
    <div className="exam-shell">
      <header className="exam-topbar glass-panel">
        <div className="exam-title">
          <div className="mini-brand"><BrainCircuit size={20} /></div>
          <div><span>Đề luyện thi</span><strong>{difficultyLabel[settings.difficulty]} · {questions.length} câu</strong></div>
        </div>
        <div className="exam-progress-copy">
          <span>Tiến độ</span>
          <strong>{answeredCount}/{questions.length}</strong>
          <div><i style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>
        </div>
        <div className={`exam-timer ${timerDanger ? 'is-danger' : ''}`}>
          <Clock3 size={18} />
          <div><span>Thời gian còn lại</span><strong>{formatTime(remaining)}</strong></div>
          <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}>
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
        <button type="button" className="submit-top-button" onClick={() => setConfirmSubmit(true)}>
          Nộp bài <Send size={15} />
        </button>
      </header>

      <div className="exam-layout">
        <aside className="question-palette glass-panel">
          <div className="palette-heading"><span>Danh sách câu</span><strong>{answeredCount}/{questions.length}</strong></div>
          <div className="palette-legend">
            <span><i className="answered" /> Đã làm</span><span><i className="flagged" /> Đánh dấu</span>
          </div>
          <div className="palette-grid">
            {questions.map((question, index) => (
              <button
                type="button"
                key={question.id}
                className={`${index === currentIndex ? 'is-current' : ''} ${answers[question.id] !== undefined ? 'is-answered' : ''} ${flags.has(question.id) ? 'is-flagged' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Câu ${index + 1}`}
              >
                {index + 1}
                {flags.has(question.id) && <i />}
              </button>
            ))}
          </div>
          <div className="palette-summary">
            <div><CheckCircle2 size={15} /><span>Đã trả lời</span><strong>{answeredCount}</strong></div>
            <div><Circle size={15} /><span>Chưa làm</span><strong>{questions.length - answeredCount}</strong></div>
            <div><Flag size={15} /><span>Đánh dấu</span><strong>{flags.size}</strong></div>
          </div>
        </aside>

        <main className="question-stage glass-panel">
          <div className="question-kicker">
            <span>Câu {currentIndex + 1} / {questions.length}</span>
            <button type="button" className={flags.has(current.id) ? 'is-active' : ''} onClick={toggleFlag}>
              <Flag size={15} fill={flags.has(current.id) ? 'currentColor' : 'none'} />
              {flags.has(current.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
            </button>
          </div>
          <h2 className="question-prompt">{current.prompt}</h2>
          <div className="option-list">
            {current.options.map((option, index) => {
              const selected = answers[current.id] === index
              return (
                <button
                  type="button"
                  key={option.id}
                  className={selected ? 'is-selected' : ''}
                  onClick={() => setAnswers((value) => ({ ...value, [current.id]: index }))}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span>{option.text}</span>
                  <span className="option-check">{selected && <Check size={15} />}</span>
                </button>
              )
            })}
          </div>
          <div className="question-footer">
            <button type="button" className="secondary-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => value - 1)}>
              <ChevronLeft size={17} /> Câu trước
            </button>
            <span>Phím <kbd>1</kbd>–<kbd>4</kbd> để chọn · <kbd>←</kbd><kbd>→</kbd> để chuyển câu</span>
            {currentIndex === questions.length - 1 ? (
              <button type="button" className="primary-button" onClick={() => setConfirmSubmit(true)}>Nộp bài <Send size={16} /></button>
            ) : (
              <button type="button" className="primary-button" onClick={() => setCurrentIndex((value) => value + 1)}>Câu tiếp <ChevronRight size={17} /></button>
            )}
          </div>
        </main>
      </div>

      {paused && (
        <div className="pause-overlay">
          <div><Pause size={30} /><h2>Bài thi đang tạm dừng</h2><p>Đồng hồ sẽ tiếp tục khi bạn quay lại.</p><button type="button" className="primary-button" onClick={() => setPaused(false)}><Play size={16} /> Tiếp tục</button></div>
        </div>
      )}
      {confirmSubmit && (
        <SubmitDialog
          answered={answeredCount}
          total={questions.length}
          onClose={() => setConfirmSubmit(false)}
          onSubmit={() => onFinish(answers, flags, totalSeconds - remaining, remaining)}
        />
      )}
    </div>
  )
}

function QuizResult({
  questions,
  answers,
  flags,
  elapsed,
  onRetry,
}: {
  questions: QuizQuestion[]
  answers: Record<string, number>
  flags: Set<string>
  elapsed: number
  onRetry: () => void
}) {
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const result = useMemo(() => calculateResult(questions, answers), [questions, answers])
  const filtered = questions.filter((question) => {
    if (filter === 'incorrect') return answers[question.id] !== question.correct_index
    if (filter === 'flagged') return flags.has(question.id)
    return true
  })
  const headline = result.percent >= 80 ? 'Xuất sắc!' : result.percent >= 60 ? 'Tiến bộ rất tốt' : 'Còn dư địa để bứt phá'

  return (
    <div className="result-page">
      <section className="result-hero glass-panel">
        <div className="result-trophy"><Trophy size={34} /></div>
        <div className="result-copy">
          <span className="eyebrow"><Medal size={13} /> Hoàn thành bài thi</span>
          <h1>{headline}</h1>
          <p>Bạn đã hoàn thành {questions.length} câu. Xem lại từng câu để khóa chặt những điểm còn nhầm.</p>
          <button type="button" className="primary-button" onClick={onRetry}><RotateCcw size={16} /> Tạo đề mới</button>
        </div>
        <div className="score-ring" style={{ '--score': `${result.percent * 3.6}deg` } as React.CSSProperties}>
          <div><strong>{result.percent}</strong><span>/ 100 điểm</span></div>
        </div>
      </section>

      <div className="result-stats">
        <div className="result-stat result-stat--correct"><CheckCircle2 size={22} /><div><strong>{result.correct}</strong><span>Câu đúng</span></div></div>
        <div className="result-stat result-stat--wrong"><XCircle size={22} /><div><strong>{result.incorrect}</strong><span>Câu sai</span></div></div>
        <div className="result-stat result-stat--empty"><Circle size={22} /><div><strong>{result.unanswered}</strong><span>Chưa trả lời</span></div></div>
        <div className="result-stat result-stat--time"><Clock3 size={22} /><div><strong>{formatTime(elapsed)}</strong><span>Thời gian làm</span></div></div>
      </div>

      <section className="review-section glass-panel">
        <div className="review-header">
          <div><span className="eyebrow">Phân tích chi tiết</span><h2>Xem lại đáp án</h2></div>
          <div className="review-filters">
            {([
              ['all', 'Tất cả'],
              ['incorrect', 'Sai / bỏ trống'],
              ['flagged', 'Đã đánh dấu'],
            ] as Array<[ReviewFilter, string]>).map(([id, label]) => (
              <button type="button" className={filter === id ? 'is-active' : ''} key={id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="review-list">
          {filtered.length === 0 ? (
            <div className="review-empty"><BadgeCheck size={28} /><p>Không có câu nào trong nhóm này.</p></div>
          ) : filtered.map((question) => {
            const questionIndex = questions.findIndex((item) => item.id === question.id)
            const chosen = answers[question.id]
            const isCorrect = chosen === question.correct_index
            return (
              <details className={`review-card ${isCorrect ? 'is-correct' : 'is-wrong'}`} key={question.id}>
                <summary>
                  <span className="review-number">{questionIndex + 1}</span>
                  <span>{question.prompt}</span>
                  <span className="review-status">{isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span>
                </summary>
                <div className="review-content">
                  <div className="review-options">
                    {question.options.map((option, index) => (
                      <div className={`${index === question.correct_index ? 'is-answer' : ''} ${index === chosen && !isCorrect ? 'is-chosen-wrong' : ''}`} key={option.id}>
                        <span>{String.fromCharCode(65 + index)}</span><p>{option.text}</p>
                        {index === question.correct_index && <CheckCircle2 size={16} />}
                        {index === chosen && !isCorrect && <XCircle size={16} />}
                      </div>
                    ))}
                  </div>
                  <div className="explanation-box"><Sparkles size={17} /><div><strong>Giải thích</strong><p>{question.explanation}</p>{question.source_hint && <span>Nguồn: {question.source_hint}</span>}</div></div>
                </div>
              </details>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function QuizWorkspace({ groups, mode }: QuizWorkspaceProps) {
  const [phase, setPhase] = useState<QuizPhase>('setup')
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings)
  const [job, setJob] = useState<QuizJob>()
  const [error, setError] = useState<string>()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({})
  const [finalFlags, setFinalFlags] = useState<Set<string>>(new Set())
  const [elapsed, setElapsed] = useState(0)
  const [bank, setBank] = useState<ExamBank>()
  const [bankBusy, setBankBusy] = useState(false)
  const [pregenerateCount, setPregenerateCount] = useState(1)
  const [activeExamId, setActiveExamId] = useState<string>()
  const [resumeProgress, setResumeProgress] = useState<ExamProgress>()

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const next = await api.examBank()
        if (active) setBank(next)
      } catch {
        // The direct quiz flow remains usable if the local bank is unavailable.
      }
    }
    void refresh()
    const poll = window.setInterval(() => void refresh(), 1800)
    return () => {
      active = false
      window.clearInterval(poll)
    }
  }, [])

  useEffect(() => {
    if (bank && pregenerateCount > Math.max(1, bank.available_slots)) {
      setPregenerateCount(Math.max(1, bank.available_slots))
    }
  }, [bank, pregenerateCount])

  useEffect(() => {
    if (phase !== 'generating' || !job?.id || job.status === 'ready') return
    const poll = window.setInterval(async () => {
      try {
        const next = await api.quizJob(job.id)
        setJob(next)
        if (next.status === 'ready' && next.questions?.length) {
          setQuestions(next.questions)
          setActiveExamId(next.id)
          setResumeProgress({
            remaining_seconds: next.duration_minutes * 60,
            current_index: 0,
            answers: {},
            flags: [],
          })
          setPhase('exam')
          requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
        } else if (next.status === 'error' || next.status === 'cancelled') {
          setError(next.message)
          setPhase('setup')
        }
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : 'Mất kết nối khi tạo đề.')
        setPhase('setup')
      }
    }, 850)
    return () => window.clearInterval(poll)
  }, [phase, job?.id, job?.status])

  const generate = async () => {
    setError(undefined)
    try {
      const next = await api.createQuiz(settings)
      setJob(next)
      setPhase('generating')
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Không thể tạo đề.')
    }
  }

  const pregenerate = async () => {
    setError(undefined)
    setBankBusy(true)
    try {
      const next = await api.pregenerateExams(pregenerateCount, settings)
      setBank(next)
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Không thể thêm đề vào hàng chờ.')
    } finally {
      setBankBusy(false)
    }
  }

  const useStored = async (exam: StoredExamSummary) => {
    setError(undefined)
    setBankBusy(true)
    try {
      const stored = await api.storedExam(exam.id)
      if (!stored.questions?.length) throw new Error('Bộ đề chưa sẵn sàng trong database.')
      setSettings({
        ...settings,
        question_count: stored.question_count,
        difficulty: stored.difficulty,
        duration_minutes: stored.duration_minutes,
      })
      setQuestions(stored.questions)
      setActiveExamId(stored.id)
      setResumeProgress({
        remaining_seconds: stored.remaining_seconds,
        current_index: stored.current_index,
        answers: stored.answers,
        flags: stored.flags,
      })
      setPhase('exam')
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    } catch (storedError) {
      setError(storedError instanceof Error ? storedError.message : 'Không thể mở bộ đề đã lưu.')
    } finally {
      setBankBusy(false)
    }
  }

  const deleteStored = async (exam: StoredExamSummary) => {
    setError(undefined)
    try {
      await api.deleteStoredExam(exam.id)
      setBank(await api.examBank())
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa bộ đề.')
    }
  }

  const cancel = async () => {
    if (job?.id) await api.cancelQuiz(job.id).catch(() => undefined)
    setPhase('setup')
  }

  const saveProgress = useCallback((progress: ExamProgress) => {
    if (!activeExamId) return
    void api.saveExamProgress(activeExamId, progress).catch(() => undefined)
  }, [activeExamId])

  const finish = (
    answers: Record<string, number>,
    flags: Set<string>,
    time: number,
    remaining: number,
  ) => {
    if (activeExamId) {
      void api.saveExamProgress(activeExamId, {
        remaining_seconds: remaining,
        current_index: Math.max(0, questions.length - 1),
        answers,
        flags: [...flags],
        completed: true,
      }).catch(() => undefined)
    }
    setFinalAnswers(answers)
    setFinalFlags(flags)
    setElapsed(time)
    setPhase('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const retry = () => {
    setJob(undefined)
    setQuestions([])
    setFinalAnswers({})
    setFinalFlags(new Set())
    setActiveExamId(undefined)
    setResumeProgress(undefined)
    setPhase('setup')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className={`workspace quiz-workspace quiz-workspace--${phase}`}>
      {error && <div className="inline-error"><AlertTriangle size={16} />{error}<button type="button" onClick={() => setError(undefined)}><X size={14} /></button></div>}
      {phase === 'setup' && (
        <QuizSetup
          settings={settings}
          setSettings={setSettings}
          onGenerate={() => void generate()}
          mode={mode}
          bank={bank}
          bankBusy={bankBusy}
          pregenerateCount={pregenerateCount}
          setPregenerateCount={setPregenerateCount}
          onPregenerate={() => void pregenerate()}
          onUseStored={(exam) => void useStored(exam)}
          onDeleteStored={(exam) => void deleteStored(exam)}
        />
      )}
      {phase === 'generating' && job && <QuizGenerating job={job} onCancel={() => void cancel()} />}
      {phase === 'exam' && questions.length > 0 && (
        <QuizExam
          key={activeExamId ?? 'exam'}
          questions={questions}
          settings={settings}
          initialProgress={resumeProgress}
          onProgress={saveProgress}
          onFinish={finish}
        />
      )}
      {phase === 'result' && <QuizResult questions={questions} answers={finalAnswers} flags={finalFlags} elapsed={elapsed} onRetry={retry} />}
    </section>
  )
}
