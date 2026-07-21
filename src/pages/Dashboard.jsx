import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { listRecords, deleteRecord, createRecord } from '../lib/records';
import { listTorqueRecords, deleteTorqueRecord, createTorqueRecord } from '../lib/torque';
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

  // Tab state
  const [activeTab, setActiveTab] = useState('records');

  // Test records state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [duplicating, setDuplicating] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Torque certs state
  const [torqueRecords, setTorqueRecords] = useState([]);
  const [torqueLoading, setTorqueLoading] = useState(false);
  const [torqueSearch, setTorqueSearch] = useState('');
  const [creatingTorque, setCreatingTorque] = useState(false);
  const [deleteTorqueId, setDeleteTorqueId] = useState(null);

  // Shared
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => { loadRecords(); }, []);
  useEffect(() => { if (activeTab === 'torque' && torqueRecords.length === 0 && !torqueLoading) loadTorqueRecords(); }, [activeTab]);

  const loadRecords = async () => {
    setLoading(true);
    const data = await listRecords();
    setRecords(data);
    setLoading(false);
  };

  const loadTorqueRecords = async () => {
    setTorqueLoading(true);
    try { const data = await listTorqueRecords(); setTorqueRecords(data); }
    finally { setTorqueLoading(false); }
  };

  const handleNew = async () => {
    setCreating(true);
    try { const created = await createRecord({ status: 'Draft' }); navigate(`/records/${created.id}/edit`); }
    catch { setCreating(false); }
  };

  const handleNewTorque = async () => {
    setCreatingTorque(true);
    try { const created = await createTorqueRecord({ status: 'Draft' }); navigate(`/torque/${created.id}/edit`); }
    catch { setCreatingTorque(false); }
  };

  const handleDuplicate = async (record) => {
    setDuplicating(record.id);
    const { id, created_at, updated_at, share_token, ...rest } = record;
    try { const created = await createRecord({ ...rest, status: 'Draft' }); navigate(`/records/${created.id}/edit`); }
    finally { setDuplicating(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRecord(deleteId);
    setRecords((r) => r.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  const handleDeleteTorque = async () => {
    if (!deleteTorqueId) return;
    await deleteTorqueRecord(deleteTorqueId);
    setTorqueRecords((r) => r.filter((x) => x.id !== deleteTorqueId));
    setDeleteTorqueId(null);
  };

  const filtered = records.filter((r) => {
    const matchSearch = !search || r.addressLocation?.toLowerCase().includes(search.toLowerCase()) || r.switchboardNumber?.toLowerCase().includes(search.toLowerCase()) || r.contractorName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredTorque = torqueRecords.filter((r) =>
    !torqueSearch || r.projectName?.toLowerCase().includes(torqueSearch.toLowerCase()) ||
    r.siteName?.toLowerCase().includes(torqueSearch.toLowerCase()) ||
    r.certificateNumber?.toLowerCase().includes(torqueSearch.toLowerCase())
  );

  const total = records.length;
  const complete = records.filter((r) => r.status === 'Complete').length;
  const drafts = records.filter((r) => r.status === 'Draft').length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0f2044] flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-[#F59E0B]" /></div>
            <span className="font-bold text-[#0f2044] text-base tracking-tight hidden sm:block">AS/NZS Test Results</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:border-[#0f2044] transition-colors">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user?.user_metadata?.full_name?.split(' ')[0] || 'Account'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1">
                <p className="px-3 py-2 text-xs text-slate-500 border-b border-slate-100">{user?.email}</p>
                <button onClick={() => signOut().then(() => navigate('/'))} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#0f2044] to-[#1e4080] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {(user?.user_metadata?.full_name || user?.email || 'Electrician').split(' ')[0]}</h1>
              <p className="text-blue-200 text-sm mt-1">AS/NZS 3000:2018 & AS/NZS 3008 Schedule of Test Results</p>
            </div>
            {activeTab === 'records' ? (
              <button onClick={handleNew} disabled={creating} className="flex items-center gap-2 bg-white text-[#0f2044] hover:bg-blue-50 font-bold px-4 py-2.5 rounded-xl shadow-lg shrink-0 disabled:opacity-60 text-sm">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} New Test Record
              </button>
            ) : (
              <button onClick={handleNewTorque} disabled={creatingTorque} className="flex items-center gap-2 bg-white text-[#0f2044] hover:bg-blue-50 font-bold px-4 py-2.5 rounded-xl shadow-lg shrink-0 disabled:opacity-60 text-sm">
                {creatingTorque ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} New Torque Cert
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row — only for test records tab */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-3 gap-4 -mt-6">
            {[
              { label: 'Total Records', value: total, bg: 'from-blue-50 to-blue-100/50', text: 'text-blue-700', border: 'border-blue-200/60' },
              { label: 'Complete', value: complete, bg: 'from-emerald-50 to-emerald-100/50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
              { label: 'Drafts', value: drafts, bg: 'from-amber-50 to-orange-50', text: 'text-amber-700', border: 'border-amber-200/60' },
            ].map(({ label, value, bg, text, border }) => (
              <div key={label} className={`bg-gradient-to-br ${bg} rounded-xl border ${border} p-4 shadow-sm`}>
                <div className={`text-2xl font-bold ${text}`}>{value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'torque' && <div className="-mt-6" />}

        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'records' ? 'bg-white text-[#0f2044] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="w-4 h-4" /> Test Records
          </button>
          <button
            onClick={() => setActiveTab('torque')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'torque' ? 'bg-white text-[#0f2044] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Wrench className="w-4 h-4" /> Torque Certs
          </button>
        </div>

        {/* ── TEST RECORDS TAB ── */}
        {activeTab === 'records' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Search by address, switchboard or contractor..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20 focus:border-[#0f2044]" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20">
                <option value="all">All Records</option>
                <option value="draft">Drafts Only</option>
                <option value="complete">Complete Only</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading records…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">{search || statusFilter !== 'all' ? 'No records match' : 'No test records yet'}</p>
                {!search && statusFilter === 'all' && (
                  <button onClick={handleNew} className="mt-4 bg-[#0f2044] text-white font-medium px-4 py-2 rounded-xl text-sm">Create First Record</button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((record) => (
                  <div key={record.id} className="bg-white rounded-xl border border-slate-100 hover:border-[#0f2044]/30 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden" onClick={() => navigate(`/records/${record.id}/edit`)}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${record.status === 'Complete' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="pl-4 pr-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <StatusBadge status={record.status} />
                          {record.switchboardNumber && <span className="text-xs font-mono text-slate-500">SB: {record.switchboardNumber}</span>}
                        </div>
                        <h3 className="font-semibold text-slate-800 truncate">{record.addressLocation || `Record ${record.id?.slice(-6)}`}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                          {record.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{record.date}</span>}
                          {record.contractorName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{record.contractorName}</span>}
                          {record.workerName && <span>{record.workerName}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/records/${record.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:border-[#0f2044] hover:text-[#0f2044] hover:bg-blue-50/50 transition-all shadow-sm">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => navigate(`/records/${record.id}/view`)} className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0f2044] hover:border-[#0f2044] transition-all shadow-sm"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDuplicate(record)} disabled={duplicating === record.id} className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0f2044] hover:border-[#0f2044] transition-all shadow-sm disabled:opacity-40">
                          {duplicating === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setDeleteId(record.id)} className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-300 transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TORQUE CERTS TAB ── */}
        {activeTab === 'torque' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search by project name, site or certificate number..." value={torqueSearch} onChange={(e) => setTorqueSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20 focus:border-[#0f2044]" />
            </div>

            {torqueLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading certificates…</div>
            ) : filteredTorque.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">{torqueSearch ? 'No certificates match' : 'No torque certificates yet'}</p>
                {!torqueSearch && (
                  <button onClick={handleNewTorque} className="mt-4 bg-[#0f2044] text-white font-medium px-4 py-2 rounded-xl text-sm">Create First Certificate</button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTorque.map((cert) => (
                  <div key={cert.id} className="bg-white rounded-xl border border-slate-100 hover:border-[#0f2044]/30 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden" onClick={() => navigate(`/torque/${cert.id}/edit`)}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${cert.status === 'Complete' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="pl-4 pr-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <StatusBadge status={cert.status} />
                          {cert.certificateNumber && <span className="text-xs font-mono text-slate-500">Cert: {cert.certificateNumber}</span>}
                        </div>
                        <h3 className="font-semibold text-slate-800 truncate">{cert.projectName || cert.siteName || `Certificate ${cert.id?.slice(-6)}`}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                          {cert.verificationDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cert.verificationDate}</span>}
                          {cert.technicianName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{cert.technicianName}</span>}
                          {cert.siteAddress && <span>{cert.siteAddress}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/torque/${cert.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:border-[#0f2044] hover:text-[#0f2044] hover:bg-blue-50/50 transition-all shadow-sm">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => setDeleteTorqueId(cert.id)} className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-300 transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-slate-400 py-4">AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3008.1.2 · Mandatory testing per clause 8.3</p>
      </div>

      {/* Delete test record modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-800 mb-2">Delete Test Record</h3>
            <p className="text-slate-500 text-sm mb-4">This will permanently delete the record. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">Delete Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete torque cert modal */}
      {deleteTorqueId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-800 mb-2">Delete Torque Certificate</h3>
            <p className="text-slate-500 text-sm mb-4">This will permanently delete the certificate. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTorqueId(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeleteTorque} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">Delete Certificate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
