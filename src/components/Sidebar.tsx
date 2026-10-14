import React from "react";
import {
  LayoutDashboard,
  Award,
  Layers,
  Users,
  Send,
  History,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "create"
  | "templates"
  | "recipients"
  | "mailer"
  | "history"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isDemoMode: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDemoMode,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "create", label: "Create Certificates", icon: Award, highlight: true },
    { id: "templates", label: "Templates", icon: Layers },
    { id: "recipients", label: "Recipients", icon: Users },
    { id: "mailer", label: "Bulk Mailer", icon: Send },
    { id: "history", label: "Email History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">CertPilot</span>
              <span className="block text-[10px] uppercase font-semibold text-blue-600 tracking-wider">
                Create. Personalize. Deliver.
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as NavTab);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info box with Demo Mode / Production status */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-2xl border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            {isDemoMode ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Demo Mode Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Live Dispatch Ready
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isDemoMode
              ? "Emails are simulated. Connect Gmail in Settings to send real certificates."
              : "Connected for live certificate dispatch directly to inboxes."}
          </p>
          <button
            onClick={() => {
              setActiveTab("settings");
              onCloseMobile();
            }}
            className="mt-2.5 text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            Email Account Settings &rarr;
          </button>
        </div>
      </aside>
    </>
  );
};
