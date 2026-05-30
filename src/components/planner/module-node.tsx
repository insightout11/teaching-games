'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Lock, GripHorizontal, RefreshCw, X, Sparkles } from 'lucide-react';
import { getModuleDisplayInfo, isUndeterminedModule } from '@/lib/planner-utils';
import type { PlanModule } from '@/stores/planner-store';

const SLOT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  takeoff: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  presentation: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  practice: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  production: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  landing: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
};

interface ModuleNodeProps {
  module: PlanModule;
  index: number;
  total: number;
  onReplace?: (id: string) => void;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
  compact?: boolean;
}

function ModuleNodeInner({
  module,
  onReplace,
  onRemove,
  canRemove,
  compact,
  isDragging,
  dragAttributes,
  dragListeners,
  setNodeRef,
  style,
}: {
  module: PlanModule;
  onReplace?: (id: string) => void;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
  compact?: boolean;
  isDragging?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
}) {
  const info = getModuleDisplayInfo(module.key);
  const colors = SLOT_COLORS[module.slotType] ?? SLOT_COLORS.practice;
  // Undetermined slots are masked as "Waypoint" so the module isn't revealed
  const undetermined = isUndeterminedModule(module);
  const Icon = undetermined ? Sparkles : info?.icon;
  const displayName = undetermined ? 'Waypoint' : (info?.name ?? module.key);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      className={`
        flex flex-col items-center gap-1 select-none
        ${compact ? 'w-16' : 'w-28'}
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${!module.isLocked && !compact ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
      onClick={() => {
        if (!module.isLocked && !compact && onReplace) {
          onReplace(module.id);
        }
      }}
    >
      <div
        className={`
          relative flex items-center justify-center rounded-xl border transition-all
          ${colors.bg} ${colors.border}
          ${compact ? 'w-12 h-12' : 'w-20 h-20'}
          ${!module.isLocked && !compact ? 'hover:scale-105 hover:shadow-lg' : ''}
          ${isDragging ? 'shadow-xl ring-2 ring-lc-blue' : ''}
        `}
      >
        {Icon && <Icon className={`${colors.text} ${compact ? 'w-5 h-5' : 'w-8 h-8'}`} />}

        {module.isLocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-lc-surface rounded-full flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-lc-text3" />
          </div>
        )}

        {!module.isLocked && !compact && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-lc-surface rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <RefreshCw className="w-2.5 h-2.5 text-lc-text3" />
          </div>
        )}

        {canRemove && !compact && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(module.id); }}
            className="absolute -top-2 -left-2 w-5 h-5 bg-lc-surface border border-lc-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:border-red-500/40"
            aria-label="Remove module"
          >
            <X className="w-2.5 h-2.5 text-lc-text3 hover:text-red-400" />
          </button>
        )}
      </div>

      <span
        className={`${colors.text} font-medium uppercase tracking-wider ${compact ? 'text-[8px]' : 'text-[10px]'}`}
      >
        {module.slotType}
      </span>

      <span
        className={`text-lc-text text-center leading-tight ${compact ? 'text-[9px]' : 'text-xs'}`}
        title={displayName}
      >
        {displayName}
      </span>

      {!module.isLocked && !compact && (
        <div className="flex items-center gap-0.5 text-lc-text3 mt-0.5">
          <GripHorizontal className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

export function ModuleNode({ module, onReplace, onRemove, canRemove, compact }: ModuleNodeProps) {
  if (module.isLocked || compact) {
    return (
      <div className="group">
        <ModuleNodeInner module={module} onReplace={onReplace} onRemove={onRemove} canRemove={canRemove} compact={compact} />
      </div>
    );
  }

  return <SortableModuleNode module={module} onReplace={onReplace} onRemove={onRemove} canRemove={canRemove} />;
}

function SortableModuleNode({
  module,
  onReplace,
  onRemove,
  canRemove,
}: {
  module: PlanModule;
  onReplace?: (id: string) => void;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="group">
      <ModuleNodeInner
        module={module}
        onReplace={onReplace}
        onRemove={onRemove}
        canRemove={canRemove}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
        setNodeRef={setNodeRef}
        style={style}
      />
    </div>
  );
}
