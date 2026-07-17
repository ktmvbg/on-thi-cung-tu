import { BrainCircuit } from 'lucide-react'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <div className="brand__mark">
        <BrainCircuit size={compact ? 19 : 22} strokeWidth={1.8} />
        <i />
      </div>
      <div className="brand__copy">
        <strong>ÔN THI CÙNG TÚ</strong>
        <span>HỌC CHẮC · THI TỐT</span>
      </div>
    </div>
  )
}
