import {
  BookMarked,
  BookOpenText,
  Check,
  FileCheck2,
  LibraryBig,
  type LucideIcon,
} from 'lucide-react'
import type { GroupId, SourceGroup } from '../types'

const groupIcons: Record<GroupId, LucideIcon> = {
  main: BookMarked,
  supplement_1: BookOpenText,
  supplement_2: LibraryBig,
  exam: FileCheck2,
}

interface SourceSelectorProps {
  groups: SourceGroup[]
  selected: GroupId[]
  onChange: (selected: GroupId[]) => void
  compact?: boolean
}

export function SourceSelector({
  groups,
  selected,
  onChange,
  compact = false,
}: SourceSelectorProps) {
  const toggle = (groupId: GroupId) => {
    if (selected.includes(groupId)) {
      if (selected.length === 1) return
      onChange(selected.filter((id) => id !== groupId))
      return
    }
    onChange([...selected, groupId])
  }

  return (
    <div className={`source-list ${compact ? 'source-list--compact' : ''}`}>
      {groups.map((group) => {
        const Icon = groupIcons[group.id]
        const active = selected.includes(group.id)
        const available = group.sources.some((source) => source.ready)
        return (
          <button
            className={`source-card source-card--${group.accent} ${active ? 'is-active' : ''}`}
            key={group.id}
            type="button"
            onClick={() => toggle(group.id)}
            aria-pressed={active}
            disabled={!available}
          >
            <span className="source-card__icon">
              <Icon size={compact ? 17 : 20} strokeWidth={1.8} />
            </span>
            <span className="source-card__copy">
              <span className="source-card__line">
                <strong>{group.label}</strong>
                <span className="source-card__count">
                  {group.sources.filter((source) => source.ready).length} file
                </span>
              </span>
              {!compact && <small>{group.description}</small>}
            </span>
            <span className="source-card__check" aria-hidden="true">
              {active && <Check size={13} strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

