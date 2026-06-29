import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.error?.message) return err.response.data.error.message;
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export default function RMDashboard() {
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingErr, setPendingErr] = useState('');
  const [pendingActionLoadingId, setPendingActionLoadingId] = useState(null);

  const [team, setTeam] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamErr, setTeamErr] = useState('');

  async function fetchPending() {
    setLoadingPending(true);
    setPendingErr('');
    try {
      const res = await api.get('/rest/reimbursements');
      const data = res?.data?.data;
      const list = Array.isArray(data) ? data : [];
      // Spec: pending RM approval
      setPending(list.filter((r) => r.status === 'PENDING' || r.status === 'RM_PENDING'));
    } catch (err) {
      setPendingErr(getErrorMessage(err));
      setPending([]);
    } finally {
      setLoadingPending(false);
    }
  }

  async function fetchTeam() {
    setLoadingTeam(true);
    setTeamErr('');
    try {
      const res = await api.get('/rest/employees');
      setTeam(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      setTeamErr(getErrorMessage(err));
      setTeam([]);
    } finally {
      setLoadingTeam(false);
    }
  }

  useEffect(() => {
    fetchPending();
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(reimbursementId, action) {
    setPendingActionLoadingId(reimbursementId);
    try {
      await api.patch('/rest/reimbursements', { reimbursementId, action });
      await fetchPending();
    } catch (err) {
      setPendingErr(getErrorMessage(err));
    } finally {
      setPendingActionLoadingId(null);
    }
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">RM Dashboard</h1>
          <p className="text-sm text-gray-600">Approve or reject reimbursements awaiting your review.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending */}
          <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">PENDING REIMBURSEMENTS</h2>
                <p className="text-sm text-gray-600">Waiting for RM approval.</p>
              </div>
              <button
                type="button"
                onClick={fetchPending}
                disabled={loadingPending}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                {loadingPending ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {pendingErr ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
                {pendingErr}
              </div>
            ) : null}

            {loadingPending ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
            ) : pending.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl">⏳</div>
                <div className="mt-2 font-bold text-gray-900">No pending items</div>
                <div className="text-sm text-gray-500">You’re all caught up.</div>
              </div>
            ) : (
              <div className="overflow-x-auto mt-5">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-500">
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3 px-3">Title</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((r, idx) => (
                      <tr key={r.reimbursementId ?? r.id ?? idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-3 text-sm font-semibold text-gray-900">{r.employeeName || r.name || 'Employee'}</td>
                        <td className="py-3 px-3 text-sm font-semibold text-gray-900">{r.title}</td>
                        <td className="py-3 px-3 text-sm text-gray-800">₹{Number(r.amount || 0)}</td>
                        <td className="py-3 px-3 text-sm text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={pendingActionLoadingId === (r.reimbursementId ?? r.id)}
                              onClick={() => act(r.reimbursementId ?? r.id, 'APPROVED')}
                              className="inline-flex items-center rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-60"
                            >
                              {pendingActionLoadingId === (r.reimbursementId ?? r.id) ? '…' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={pendingActionLoadingId === (r.reimbursementId ?? r.id)}
                              onClick={() => act(r.reimbursementId ?? r.id, 'REJECTED')}
                              className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60"
                            >
                              {pendingActionLoadingId === (r.reimbursementId ?? r.id) ? '…' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Team */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">MY TEAM</h2>
            <p className="text-sm text-gray-600">Your assigned EMP employees.</p>

            {teamErr ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
                {teamErr}
              </div>
            ) : null}

            {loadingTeam ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
            ) : team.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl">👥</div>
                <div className="mt-2 font-bold text-gray-900">No team members</div>
                <div className="text-sm text-gray-500">No employees assigned to you.</div>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-500">
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((e, idx) => (
                      <tr key={e.userId ?? e.id ?? idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-3 text-sm font-semibold text-gray-900">{e.name}</td>
                        <td className="py-3 px-3 text-sm text-gray-600">{e.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

