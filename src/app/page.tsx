'use client';

import React, { useEffect, useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import TopNav from '@/components/layout/TopNav';
import TabNav from '@/components/layout/TabNav';
import StatsOverview from '@/components/dashboard/StatsOverview';
import FiltersBar from '@/components/dashboard/FiltersBar';
import PriorityStream from '@/components/dashboard/PriorityStream';
import IraqMapPanel from '@/components/map/IraqMapPanel';
import CaseDetailsModal from '@/components/dashboard/CaseDetailsModal';
import NotificationsDrawer from '@/components/dashboard/NotificationsDrawer';
import NewCaseModal from '@/components/cases/NewCaseModal';
import TaskArchiveView from '@/components/archive/TaskArchiveView';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import {
  EfuCase,
  Company,
  Province,
  Team,
  DashboardStats,
  ProvinceStat,
  FilterOptions,
  CaseStatus,
  SystemNotification,
} from '@/types/database';
import { getCaseAgeHours } from '@/lib/utils';
import { isCaseActive, resolveProvinceId } from '@/lib/regionMapper';
import { canViewProfile, canViewArchive } from '@/lib/auth/rbac';
import { UserCheck, Bell, Activity, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useTelegram();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-redirect normal users away from profile or archive tabs if unauthorized
  useEffect(() => {
    if (activeTab === 'profile' && !canViewProfile(user?.role)) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'archive' && !canViewArchive(user?.role)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, user?.role]);

  // Core Data States
  const [cases, setCases] = useState<EfuCase[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Modals & Drawer States
  const [selectedCase, setSelectedCase] = useState<EfuCase | null>(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);


  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    maintenance: 'ALL',
    region: 'ALL',
    department: 'ALL',
    provinceId: 'ALL',
    caseAge: 'ALL',
    status: 'ALL',
    escalation: 'ALL',
    grRequest: 'ALL',
    searchQuery: '',
  });

  // Fetch Dashboard Data from API / Supabase
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      const json = await res.json();

      if (json.success && json.data) {
        const nextCases = json.data.cases || [];
        setCases(nextCases);
        setSelectedCase((current) => {
          if (!current) return current;
          return nextCases.find((item: EfuCase) => item.id === current.id || item.case_id === current.case_id) || current;
        });
      }

      // Fetch metadata lists
      const [compRes, provRes, teamRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/provinces'),
        fetch('/api/teams'),
      ]);

      const [compJson, provJson, teamJson] = await Promise.all([
        compRes.json(),
        provRes.json(),
        teamRes.json(),
      ]);

      if (compJson.success) setCompanies(compJson.companies || []);
      if (provJson.success) setProvinces(provJson.provinces || []);
      if (teamJson.success) setTeams(teamJson.teams || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Show Temporary Toast Message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Calculate Aggregated Metrics (Active Cases ONLY)
  const stats: DashboardStats = useMemo(() => {
    const activeList = cases.filter((c) => isCaseActive(c));
    const totalEFU = activeList.reduce((acc, curr) => acc + (curr.efu || 0), 0);
    const affectedUsers = activeList.reduce((acc, curr) => acc + (curr.affected_users || curr.efu || 0), 0);
    const criticalCases = activeList.filter((c) => c.priority === 'CRITICAL' || c.efu >= 200).length;

    const nowMs = Date.now();
    const casesOlderThan4Hours = activeList.filter((c) => {
      const createdMs = new Date(c.created_at).getTime();
      return nowMs - createdMs > 4 * 3600 * 1000;
    }).length;

    return {
      totalCases: cases.length,
      activeCases: activeList.length,
      totalEFU,
      affectedUsers,
      criticalCases,
      casesOlderThan4Hours,
    };
  }, [cases]);

  // Province Threat Map Statuses
  const provinceStats: ProvinceStat[] = useMemo(() => {
    const nowMs = Date.now();
    return provinces.map((prov) => {
      const provCases = cases.filter((c) => {
        if (c.province_id === prov.id || c.province?.id === prov.id) return true;
        if (c.province?.code && c.province.code.toLowerCase() === prov.code.toLowerCase()) return true;
        return resolveProvinceId(c.region, provinces) === prov.id;
      });
      const provActiveCases = provCases.filter((c) => isCaseActive(c));
      const provEfu = provActiveCases.reduce((a, b) => a + (b.efu || 0), 0);
      const provUsers = provActiveCases.reduce((a, b) => a + (b.affected_users || b.efu || 0), 0);
      const provCritical = provActiveCases.filter((c) => c.priority === 'CRITICAL' || c.efu >= 200).length;
      const highestEFU = provCases.reduce((max, c) => Math.max(max, c.efu || 0), 0);

      const hasCriticalOrOld = provActiveCases.some((c) => {
        const ageHours = (nowMs - new Date(c.created_at).getTime()) / (3600 * 1000);
        return c.efu >= 200 || ageHours >= 4 || c.priority === 'CRITICAL';
      });

      let statusColor: 'RED' | 'ORANGE' | 'CYAN' = 'CYAN';
      if (hasCriticalOrOld || provEfu >= 200 || provCritical > 0) {
        statusColor = 'RED';
      } else if (provActiveCases.length > 0 || provUsers > 0) {
        statusColor = 'ORANGE';
      }

      const sortedByTime = [...provCases].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        provinceId: prov.id,
        provinceCode: prov.code,
        provinceName: prov.name,
        provinceNameAr: prov.name_ar,
        activeCases: provActiveCases.length,
        totalEFU: provEfu,
        affectedUsers: provUsers,
        criticalCases: provCritical,
        highestEFU,
        lastCaseTime: sortedByTime[0]?.created_at || null,
        caseCount: provCases.length,
        statusColor,
      };
    });
  }, [cases, provinces]);

  // Filter Active Cases Logic (Excludes Closed & Archived)
  const filteredCases = useMemo(() => {
    const activeOnly = cases.filter((c) => isCaseActive(c));

    return activeOnly.filter((c) => {
      if (filters.maintenance !== 'ALL' && c.maintenance !== filters.maintenance) return false;
      if (filters.provinceId !== 'ALL' && c.province_id !== filters.provinceId) return false;
      if (filters.escalation !== 'ALL' && c.escalation?.toUpperCase() !== filters.escalation) return false;
      if (filters.status !== 'ALL' && c.status !== filters.status) return false;
      if (filters.grRequest === 'YES' && !c.gr_request) return false;
      if (filters.grRequest === 'NO' && c.gr_request) return false;

      const ageHours = getCaseAgeHours(c.created_at);
      if (filters.caseAge === '<1H' && ageHours >= 1) return false;
      if (filters.caseAge === '1-2H' && (ageHours < 1 || ageHours >= 2)) return false;
      if (filters.caseAge === '2-4H' && (ageHours < 2 || ageHours >= 4)) return false;
      if (filters.caseAge === '>4H' && ageHours < 4) return false;
      if (filters.caseAge === '>8H' && ageHours < 8) return false;
      if (filters.caseAge === '>24H' && ageHours < 24) return false;

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchSrc = c.case_id.toLowerCase().includes(q);
        const matchFms = (c.fms_url || '').toLowerCase().includes(q);
        const matchFdt = c.fdt.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchRegion = (c.region || '').toLowerCase().includes(q);
        if (!matchSrc && !matchFms && !matchFdt && !matchDesc && !matchRegion) return false;
      }

      return true;
    });
  }, [cases, filters]);

  // Refresh dashboard data periodically while keeping server credentials private.
  useEffect(() => {
    const refreshTimer = window.setInterval(fetchDashboardData, 30000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [fetchDashboardData]);

  // Import / Create Case Handler
  const handleCreateCase = async (casePayload: any) => {
    try {
      const res = await fetch('/api/cases/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casePayload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Failed to import task' };
      }

      triggerToast(`Task ${json.case.case_id} imported/updated successfully!`);
      await fetchDashboardData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Close & Archive Task Handler
  const handleCloseTask = useCallback(async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/close`, { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        setSelectedCase(null);
        triggerToast(`Task closed and moved to Archive!`);
        await fetchDashboardData();
      }
    } catch (e) {
      console.error('API close task error:', e);
    }
  }, [fetchDashboardData]);

  const handleDeleteCase = useCallback(async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        triggerToast(json.error || 'Failed to delete task');
        return;
      }

      setSelectedCase(null);
      triggerToast('Task deleted successfully');
      await fetchDashboardData();
    } catch (e) {
      console.error('API delete task error:', e);
      triggerToast('Failed to delete task');
    }
  }, [fetchDashboardData]);

  // Update Case Status Handler
  const handleUpdateStatus = useCallback(
    async (caseId: string, newStatus: CaseStatus) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        const json = await res.json();
        if (json.success && json.case) {
          triggerToast(`Task status updated to ${newStatus}`);
          await fetchDashboardData();

          const isDone =
            newStatus === 'RESOLVED' ||
            newStatus === 'CLOSED' ||
            json.case.status === 'RESOLVED' ||
            json.case.status === 'CLOSED' ||
            json.case.escalation === 'CLOSED';

          if (isDone) {
            setSelectedCase(null);
          } else if (selectedCase && (selectedCase.id === caseId || selectedCase.case_id === caseId)) {
            setSelectedCase(json.case);
          }
        }
      } catch (e) {
        console.error('API update status error:', e);
      }
    },
    [fetchDashboardData, selectedCase]
  );

  // Assign Team Handler
  const handleAssignTeam = useCallback(
    async (caseId: string, teamId: string) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_id: teamId }),
        });

        const json = await res.json();
        if (json.success && json.case) {
          triggerToast(`Maintenance team assigned successfully!`);
          await fetchDashboardData();
          if (selectedCase && (selectedCase.id === caseId || selectedCase.case_id === caseId)) {
            setSelectedCase(json.case);
          }
        }
      } catch (e) {
        console.error('API assign team error:', e);
      }
    },
    [fetchDashboardData, selectedCase]
  );

  // Add Note Handler
  const handleAddNote = useCallback(async (caseId: string, noteText: string) => {
    try {
      await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
    } catch (e) {
      console.error('API note insert error:', e);
    }
  }, []);

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 pb-20 md:pb-6 relative selection:bg-sky-500/30">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 bg-slate-900/95 border border-emerald-500/50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-emerald-300 text-xs font-mono flex items-center gap-2.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Tab 1: Developer System Settings */}
        {activeTab === 'profile' && canViewProfile(user?.role) ? (
          <div className="p-6 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl max-w-xl mx-auto space-y-4 font-mono shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <UserCheck className="w-5 h-5 text-sky-400" /> DEVELOPER SYSTEM CONFIGURATION
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl flex justify-between items-center">
                <span className="text-slate-400">OPERATOR NAME</span>
                <span className="text-slate-100 font-bold">
                  {user?.first_name || 'Operations'} {user?.last_name || 'Agent'}
                </span>
              </div>
              <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl flex justify-between items-center">
                <span className="text-slate-400">SYSTEM ROLE</span>
                <span className="text-emerald-400 font-bold">DEVELOPER CONTROLLER</span>
              </div>
              <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl flex justify-between items-center">
                <span className="text-slate-400">AUTHENTICATION STATUS</span>
                <span className="text-sky-400 font-bold">TELEGRAM WEBAPP AUTHENTICATED</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab 2: Task Archive View (Protected: VIEW_ARCHIVE) */}
        {activeTab === 'archive' && canViewArchive(user?.role) && (
          <TaskArchiveView
            provinces={provinces}
            teams={teams}
            companies={companies}
            onSelectCase={(c) => setSelectedCase(c)}
            onRefreshTrigger={fetchDashboardData}
          />
        )}

        {/* Tab 3: All Cases Database View */}
        {activeTab === 'cases' && (
          <div className="space-y-4 font-mono">
            {/* Page Title & Subtitle Banner */}
            <div className="p-5 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl select-none">
              <div>
                <h2 className="text-base font-bold text-white tracking-wider uppercase">
                  ALL OPERATIONS CASES DATABASE
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Complete operations case and incident records with advanced filtering and live search.
                </p>
              </div>
              <div className="px-3.5 py-1.5 bg-[#080d1a] border border-slate-700/60 rounded-xl text-xs text-slate-300 font-bold">
                Total cases: <span className="text-sky-400">{cases.length}</span> | Active cases: <span className="text-amber-400">{stats.activeCases}</span>
              </div>
            </div>

            <StatsOverview
              stats={stats}
              onSelectStatFilter={(filterType) => {
                if (filterType === 'sla') {
                  setFilters((prev) => ({ ...prev, caseAge: '>4H' }));
                } else if (filterType === 'total' || filterType === 'active') {
                  setFilters((prev) => ({ ...prev, caseAge: 'ALL' }));
                }
              }}
            />
            <FiltersBar
              companies={companies}
              provinces={provinces}
              filters={filters}
              setFilters={setFilters}
              onReset={() =>
                setFilters({
                  maintenance: 'ALL',
                  region: 'ALL',
                  department: 'ALL',
                  provinceId: 'ALL',
                  caseAge: 'ALL',
                  status: 'ALL',
                  escalation: 'ALL',
                  grRequest: 'ALL',
                  searchQuery: '',
                })
              }
            />
            <div className="w-full">
              <PriorityStream
                cases={filteredCases}
                onSelectCase={(c) => setSelectedCase(c)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Map Operations Control View */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl font-mono text-xs text-slate-200 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <span className="font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" /> FULL-SCALE IRAQ 18-GOVERNORATE THREAT MAP
              </span>
              <span className="text-slate-400 text-[11px] font-sans">Click any governorate to view live statistics</span>
            </div>
            <div className="w-full min-h-[600px]">
              <IraqMapPanel provinceStats={provinceStats} />
            </div>
          </div>
        )}

        {/* Tab 5: Notifications & System Alerts View */}
        {activeTab === 'notifications' && (
          <div className="p-6 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl max-w-3xl mx-auto space-y-4 font-mono shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-400" /> SYSTEM NOTIFICATIONS & THREAT ALERTS
              </h2>
              <button
                onClick={() =>
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                }
                className="px-3.5 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              >
                MARK ALL READ
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 bg-[#080d1a] border rounded-xl space-y-1 transition-all ${
                    n.type === 'CRITICAL'
                      ? 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={n.type === 'CRITICAL' ? 'text-rose-400' : 'text-sky-300'}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Main Dashboard (Simplified: Active Cases & Threat Map Only) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Top Statistics Cards Grid */}
            <StatsOverview
              stats={stats}
              onSelectStatFilter={(filterType) => {
                if (filterType === 'total') {
                  setActiveTab('cases');
                } else if (filterType === 'sla') {
                  setFilters((prev) => ({ ...prev, caseAge: '>4H' }));
                  setActiveTab('cases');
                }
              }}
            />

            {/* Dual Panel Operations Split (Desktop: Map Left, Active Stream Feed Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Interactive 18-Province Iraq Map Panel */}
              <div className="lg:col-span-6 xl:col-span-7 h-full min-h-[500px]">
                <IraqMapPanel provinceStats={provinceStats} />
              </div>

              {/* Right Column: Active Priority Stream Feed Only */}
              <div className="lg:col-span-6 xl:col-span-5 h-full">
                <PriorityStream
                  cases={cases.filter((c) => isCaseActive(c))}
                  onSelectCase={(c) => setSelectedCase(c)}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Case Creation Modal Form */}
      <NewCaseModal
        companies={companies}
        provinces={provinces}
        teams={teams}
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onSubmitCase={handleCreateCase}
      />

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <CaseDetailsModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddNote={handleAddNote}
          onCloseTask={handleCloseTask}
          onDeleteCase={handleDeleteCase}
        />
      )}

      {/* Real-time System Notifications Drawer */}
      <NotificationsDrawer
        notifications={notifications}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />

      {/* Mobile Sticky Tab Navbar */}
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
