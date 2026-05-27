'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { usePlannerStore } from '@/stores/planner-store';
import { ModuleNode } from './module-node';
import { FlightPathTrack } from '@/components/ui/flight-path-track';

interface FlightPathSVGProps {
  compact?: boolean;
}

export function FlightPathSVG({ compact }: FlightPathSVGProps) {
  const { modules, moveModule, setReplaceDrawerModuleId, removeModule } = usePlannerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setContainerWidth] = useState(800);

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateWidth]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      moveModule(oldIndex, newIndex);
    }
  };

  if (modules.length === 0) return null;

  const nodeSpacing = compact ? 80 : 140;
  const paddingX = compact ? 30 : 60;
  const svgHeight = compact ? 40 : 60;
  const cy = svgHeight / 2;
  const svgWidth = paddingX * 2 + (modules.length - 1) * nodeSpacing;

  const middleModules = modules.filter((m) => !m.isLocked);
  const middleIds = middleModules.map((m) => m.id);

  const handleReplace = (id: string) => {
    setReplaceDrawerModuleId(id);
  };

  const pathContent = (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <FlightPathTrack
        count={modules.length}
        nodeSpacing={nodeSpacing}
        paddingX={paddingX}
        cy={cy}
        svgHeight={svgHeight}
        segments={modules.slice(1).map(() => ({
          stroke: 'currentColor',
          className: 'text-lc-border',
          strokeDasharray: compact ? undefined : '6 3',
          strokeWidth: compact ? 1.5 : 2,
        }))}
        nodes={modules.map((m) => ({
          r: compact ? 3 : 4,
          fillClassName: m.isLocked
            ? m.slotType === 'takeoff'
              ? 'fill-amber-400'
              : 'fill-teal-400'
            : 'fill-lc-blue',
        }))}
      />

      {/* Module nodes positioned over the SVG */}
      <div
        className="flex items-start"
        style={{
          width: svgWidth,
          minWidth: svgWidth,
          paddingTop: compact ? 4 : 8,
        }}
      >
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            className="flex-shrink-0"
            style={{
              width: nodeSpacing,
              display: 'flex',
              justifyContent: 'center',
              marginLeft: i === 0 ? paddingX - nodeSpacing / 2 : 0,
            }}
          >
            <ModuleNode
              module={mod}
              index={i}
              total={modules.length}
              onReplace={handleReplace}
              onRemove={removeModule}
              canRemove={!compact && modules.length > 1}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </div>
  );

  if (compact) {
    return pathContent;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={middleIds} strategy={horizontalListSortingStrategy}>
        {pathContent}
      </SortableContext>
    </DndContext>
  );
}
