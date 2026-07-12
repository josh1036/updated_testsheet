import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { listRecords, deleteRecord, createRecord } from '../lib/records';
import { listTorqueRecords, deleteTorqueRecord } from '../lib/torque';
import { Plus, Search, Zap, LogOut, Loader2, FileText, Calendar, CheckCircle2, Clock, Copy, Trash2, Eye, Edit3, ChevronDown, User, Wrench } from 'lucide-react';

function StatusBadge({ status }) {
  return status === 'Complete' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Draft
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [records, setRecords] = useState([]);
  const [torqueRecords, setTorqueRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [duplicating, setDuplicating] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [docType, setDocType] = useState('test');

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    setLoading(true);
    const [testData, torqueData] = await Promise.all([
      listRecords().catch(() => []),
      listTorqueRecords().catch(() => []),
    ]);
    setRecords(testData);
    setTorqueRecords(torqueData);
    setLoading(false);
  };

  const handleNew = async () => {
    setCreating(true);
    try {
      if (docType === 'torque') {
        navigate('/torque/new');
      } else {
        const created = await createRecord({ status: 'Draft' });
        navigate('/records/' + created.id + '/edit');
      }
    } catch { setCreating(false); }
  };

  const handleDuplicate = async (record) => {
    setDuplicating(record.id);
    const { id, created_date, updated_date, ...rest } = record;
    try {
      if (docType === 'torque') {
        navigate('/torque/new');
      } else {
        const created = await createRecord({ ...rest, status: 'Draft' });
        navigate('/records/' + created.id + '/edit');
      }
    } finally { setDuplicating(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (deleteId.type === 'torque') {
      await deleteTorqueRecord(deleteId.id);
      setTorqueRecords((r) => r.filter((x) => x.id !== deleteId.id));
    } else {
      await deleteRecord(deleteId.id);
      setRecords((r) => r.filter((x) => x.id !== deleteId.id));
    }
    setDeleteId(null);
  };

  const activeRecords = docType === 'torque' ? torqueRecords : records;

  const filtered = activeRecords.filter((r) => {
    const matchSearch = !search || (docType === 'torque'
      ? (r.projectName?.toLowerCase().includes(search.toLowerCase()) || r.certificateNumber?.toLowerCase().includes(search.toLowerCase()) || r.client?.toLowerCase().includes(search.toLowerCase()))
      : (r.addressLocation?.toLowerCase().includes(search.toLowerCase()) || r.switchboardNumber?.toLowerCase().includes(search.toLowerCase()) || r.contractorName?.toLowerCase().includes(search.toLowerCase()))
    );
    const matchStatus = statusFilter === 'all' || r.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = activeRecords.length;
  const complete = activeRecords.filter((r) => r.status === 'Complete').length;
  const drafts = activeRecords.filter((r) => r.status === 'Draft').length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0f2044] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>
            <span className="font-bold text-[#0f2044] text-base tracking-tight hidden sm:block">TestSheet</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:border-[#0f2044]">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{(user?.user_metadata?.full_name || user?.email || 'Account').split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px] z-50">
                <p className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">{user?.email}</p>
                <button onClick={signOut} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f2044] to-[#1e4080] text-white">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {(user?.user_metadata?.full_name || user?.email || 'Electrician').split(' ')[0]}</h1>
              <p className="text-blue-200 text-sm mt-1">AS/NZS 3000:2018 · Electrical Document Management</p>
            </div>
            <button onClick={handleNew} disabled={creating} className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#0f2044] rounded-xl font-bold text-sm shadow-lg hover:bg-blue-50 disabled:opacity-60 shrink-0">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {docType === 'torque' ? 'New Torque Certificate' : 'New Test Record'}
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            <button onClick={() => { setDocType('test'); setSearch(''); setStatusFilter('all'); }}
              className={"flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all " + (docType === 'test' ? 'bg-[#f8fafc] text-[#0f2044]' : 'bg-white/10 text-white/80 hover:bg-white/20')}>
              <Zap className="w-4 h-4" /> Electrical Test Sheet
              <span className={"px-1.5 py-0.5 rounded-full text-xs font-bold " + (docType === 'test' ? 'bg-[#0f2044] text-white' : 'bg-white/20 text-white')}>{records.length}</span>
            </button>
            <button onClick={() => { setDocType('torque'); setSearch(''); setStatusFilter('all'); }}
              className={"flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all " + (docType === 'torque' ? 'bg-[#f8fafc] text-[#0f2044]' : 'bg-white/10 text-white/80 hover:bg-white/20')}>
              <Wrench className="w-4 h-4" /> Termination Torque Certificate
              <span className={"px-1.5 py-0.5 rounded-full text-xs font-bold " + (docType === 'torque' ? 'bg-[#0f2044] text-white' : 'bg-white/20 text-white')}>{torqueRecords.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 -mt-6">
          {[
            { label: 'Total Records', value: total, text: 'text-blue-700', bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200/60' },
            { label: 'Complete', value: complete, text: 'text-emerald-700', bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/60' },
            { label: 'Drafts', value: drafts, text: 'text-amber-700', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200/60' },
          ].map(({ label, value, text, bg, border }) => (
            <div key={label} className={"bg-gradient-to-br " + bg + " rounded-xl border " + border + " p-4 shadow-sm"}>
              <div className={"text-2xl font-bold " + text}>{value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder={docType === 'torque' ? 'Search by project, certificate or client...' : 'Search by address, switchboard or contractor...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20 focus:border-[#0f2044]"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20">
            <option value="all">All Records</option>
            <option value="draft">Drafts Only</option>
            <option value="complete">Complete Only</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading records…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            {docType === 'torque' ? <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" /> : <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />}
            <p className="text-slate-500 font-medium">{search || statusFilter !== 'all' ? 'No records match' : docType === 'torque' ? 'No torque certificates yet' : 'No test records yet'}</p>
            {!search && statusFilter === 'all' && (
              <button onClick={handleNew} className="mt-4 px-4 py-2 bg-[#0f2044] text-white text-sm rounded-xl font-semibold">
                {docType === 'torque' ? 'Create First Certificate' : 'Create First Record'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((record) => {
              const isTorque = docType === 'torque';
              const editPath = isTorque ? '/torque/' + record.id + '/edit' : '/records/' + record.id + '/edit';
              const title = isTorque
                ? (record.projectName || record.certificateNumber || 'Certificate #' + record.id?.slice(-6))
                : (record.addressLocation || 'Record #' + record.id?.slice(-6));
              const sub1 = isTorque ? record.siteName : record.switchboardNumber;
              const sub2 = isTorque ? record.client : record.contractorName;
              const dateVal = isTorque ? record.verificationDate : record.date;

              return (
                <div key={record.id}
                  className="bg-white rounded-xl border border-slate-100 hover:border-[#0f2044]/30 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(editPath)}>
                  <div className={"absolute left-0 top-0 bottom-0 w-1 " + (record.status === 'Complete' ? 'bg-emerald-400' : record.status === 'Requires Rectification' ? 'bg-red-400' : 'bg-amber-400')} />
                  <div className="pl-4 pr-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={record.status} />
                        {sub1 && <span className="text-xs font-mono text-slate-500">{sub1}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-800 truncate">{title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        {dateVal && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateVal}</span>}
                        {sub2 && <span className="flex items-center gap-1"><User className="w-3 h-3" />{sub2}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(editPath)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:border-[#0f2044] hover:text-[#0f2044] hover:bg-blue-50/50 transition-all shadow-sm">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      {!isTorque && (
                        <button onClick={() => navigate('/records/' + record.id + '/view')}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0f2044] hover:border-[#0f2044] transition-all shadow-sm">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setDeleteId({ id: record.id, type: isTorque ? 'torque' : 'test' })}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-300 transition-all shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 py-4">TestSheet · AS/NZS 3000:2018 · testsheet.com.au</p>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Delete {deleteId.type === 'torque' ? 'Certificate' : 'Test Record'}</h3>
            <p className="text-slate-500 text-sm mb-5">This will permanently delete the record. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
