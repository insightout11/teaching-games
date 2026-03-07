'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { usePlannerStore } from '@/stores/planner-store';
import { FLIGHT_PLAN_ITEMS } from '@/lib/flight-plan-config';
import { getModuleDisplayInfo } from '@/lib/planner-utils';

export function ReplaceDrawer() {
  const {
    modules,
    replaceDrawerModuleId,
    goals,
    setReplaceDrawerModuleId,
    replaceModule,
  } = usePlannerStore();
  const [search, setSearch] = useState('');

  const targetModule = replaceDrawerModuleId
    ? modules.find((m) => m.id === replaceDrawerModuleId)
    : null;

  const currentInfo = targetModule ? getModuleDisplayInfo(targetModule.key) : null;

  const usedKeys = useMemo(() => new Set(modules.map((m) => m.key)), [modules]);

  const { recommended, allItems } = useMemo(() => {
    if (!targetModule) return { recommended: [], allItems: [] };

    const items = FLIGHT_PLAN_ITEMS.filter(
      (item) => !usedKeys.has(item.key) && item.key !== 'mission-selector',
    );

    const searchLower = search.toLowerCase();
    const filtered = search
      ? items.filter((item) => {
          const info = getModuleDisplayInfo(item.key);
          return info?.name.toLowerCase().includes(searchLower);
        })
      : items;

    const scored = filtered.map((item) => {
      let score = 0;
      if (item.slotFit.includes(targetModule.slotType)) score += 5;
      for (const g of goals) {
        if (item.goalFit.includes(g)) score += 2;
      }
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const rec = scored.filter((s) => s.score >= 5).slice(0, 4);
    return { recommended: rec, allItems: scored };
  }, [targetModule, usedKeys, goals, search]);

  const handleSelect = (key: string) => {
    if (!targetModule) return;
    const fpItem = FLIGHT_PLAN_ITEMS.find((i) => i.key === key);
    const slotType = fpItem?.slotFit.includes(targetModule.slotType)
      ? targetModule.slotType
      : fpItem?.slotFit[0] ?? targetModule.slotType;
    replaceModule(targetModule.id, key, slotType);
    setReplaceDrawerModuleId(null);
    setSearch('');
  };

  const handleClose = () => {
    setReplaceDrawerModuleId(null);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {replaceDrawerModuleId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] bg-lc-card border-l border-lc-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-lc-border">
              <div>
                <h2 className="font-semibold text-lc-text">Replace Module</h2>
                {targetModule && (
                  <span className="text-xs text-lc-text3 capitalize">
                    {targetModule.slotType} slot
                  </span>
                )}
              </div>
              <button onClick={handleClose} className="p-1 hover:bg-lc-surface rounded-lg">
                <X className="w-5 h-5 text-lc-text3" />
              </button>
            </div>

            {/* Current module */}
            {currentInfo && (
              <div className="p-4 border-b border-lc-border">
                <p className="text-xs text-lc-text3 mb-1">Currently:</p>
                <div className="flex items-center gap-2 p-2 bg-lc-blue/10 rounded-lg border border-lc-blue/20">
                  {(() => {
                    const Icon = currentInfo.icon;
                    return <Icon className="w-4 h-4 text-lc-blue" />;
                  })()}
                  <span className="text-sm font-medium text-lc-blue">{currentInfo.name}</span>
                  <span className="ml-auto text-xs bg-lc-blue/15 text-lc-blue px-2 py-0.5 rounded-full uppercase">
                    {currentInfo.type}
                  </span>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b border-lc-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search modules..."
                  className="w-full pl-10 pr-4 py-2 bg-lc-surface border border-lc-border rounded-lg text-sm text-lc-text focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Recommended */}
              {recommended.length > 0 && !search && (
                <div>
                  <h3 className="text-xs font-semibold text-lc-text3 uppercase tracking-wider mb-2">
                    Recommended
                  </h3>
                  <div className="space-y-2">
                    {recommended.map(({ item }) => (
                      <DrawerItem key={item.key} itemKey={item.key} onSelect={handleSelect} />
                    ))}
                  </div>
                </div>
              )}

              {/* All */}
              <div>
                <h3 className="text-xs font-semibold text-lc-text3 uppercase tracking-wider mb-2">
                  {search ? 'Results' : 'All Modules'}
                </h3>
                <div className="space-y-2">
                  {allItems.map(({ item }) => (
                    <DrawerItem key={item.key} itemKey={item.key} onSelect={handleSelect} />
                  ))}
                  {allItems.length === 0 && (
                    <p className="text-sm text-lc-text3 text-center py-4">No matching modules</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerItem({
  itemKey,
  onSelect,
}: {
  itemKey: string;
  onSelect: (key: string) => void;
}) {
  const info = getModuleDisplayInfo(itemKey);
  if (!info) return null;

  const Icon = info.icon;

  return (
    <button
      onClick={() => onSelect(itemKey)}
      className="w-full flex items-center gap-3 p-3 bg-lc-surface rounded-lg border border-lc-border hover:border-lc-blue/40 transition-all text-left group"
    >
      <Icon className="w-5 h-5 text-lc-text3 group-hover:text-lc-blue transition-colors" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-lc-text group-hover:text-lc-blue transition-colors">
          {info.name}
        </p>
        <p className="text-xs text-lc-text3 truncate">{info.description}</p>
      </div>
      <span className="text-[10px] bg-lc-border text-lc-text3 px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">
        {info.type}
      </span>
    </button>
  );
}
