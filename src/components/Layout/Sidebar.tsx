import React from 'react';
import { NavSection } from '../../types/note';
import {
  Archive,
  BookMarked,
  BookOpen,
  Clock,
  FilePlus2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Layers,
  Settings,
  Table2,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeSection: NavSection;
  dueRevisionCount: number;
  bookmarkCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectSection: (section: NavSection) => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'notes', label: 'My Notes', icon: FileText },
  { id: 'create', label: 'Create New Note', icon: FilePlus2 },
  { id: 'subjects', label: 'Subject Library', icon: FolderKanban },
  { id: 'revision', label: 'Revision Centre', icon: Clock },
  { id: 'comparisons', label: 'Comparison Tables', icon: Table2 },
  { id: 'prelims', label: 'Prelims Preparation', icon: Layers },
  { id: 'mains', label: 'Mains Preparation', icon: BookOpen },
  { id: 'bookmarks', label: 'Bookmarks', icon: BookMarked },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  dueRevisionCount,
  bookmarkCount,
  isOpenMobile,
  onCloseMobile,
  onSelectSection,
}) => {
  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-[#1E3A5F] tracking-tight">Sankalan</div>
          <div className="text-[11px] text-slate-500">UPSC Cornell Notebook</div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-slate-500 hover:text-slate-800"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const count =
            item.id === 'revision'
              ? dueRevisionCount
              : item.id === 'bookmarks'
                ? bookmarkCount
                : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                item.id === 'create'
                  ? 'bg-[#1E3A5F] text-white hover:bg-[#162C49] my-1.5 font-semibold'
                  : isActive
                    ? 'bg-[#EFF4FA] text-[#1E3A5F] font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.id === 'create'
                      ? 'text-white'
                      : isActive
                        ? 'text-[#1E3A5F]'
                        : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {count > 0 && (
                <span
                  className={`text-[11px] font-mono-tabular font-semibold ${
                    item.id === 'revision' ? 'text-amber-700' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-200 text-[11px] text-slate-400">
        Shortcuts: Ctrl+F Find · Ctrl+P Export
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">{navContent}</aside>

      {/* Mobile slide-over sidebar */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-900/40"
          onClick={onCloseMobile}
        >
          <div onClick={(e) => e.stopPropagation()} className="h-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
