import { type SidebarTab,useUIStore } from '@stores/ui';
import { withBlur } from '@utils/blur';

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'help', label: 'Help' },
  { id: 'config', label: 'Config' },
];

export default function TabBar() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <div className="flex border-b border-zinc-800" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={withBlur(() => setActiveTab(tab.id))}
          className={`flex-1 px-4 py-2 text-xs uppercase tracking-wider transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500
            ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-500 bg-zinc-800/30'
                : 'text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/20'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
