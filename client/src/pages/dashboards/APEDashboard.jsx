import { useEffect, useState } from 'react';
import api from '../../api/axios';

function getErrorMessage(err) {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.response?.data?.error?.message) return err.response.data.error.message;
    if (err?.message) return err.message;
    return 'Something went wrong. Please try again.';
}

export default function APEDashboard() {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    async function fetchPending() {
        setLoading(true);
        setErr('');
        try {
            const res = await api.get('/rest/reimbursements');
            const data = res?.data?.data;
            const list = Array.isArray(data) ? data : [];
            // Spec: already approved by RM, pending APE action
            setPending(list.filter((r) => r.status === 'PENDING' || r.status === 'APE_PENDING'));
        } catch (e) {
            setErr(getErrorMessage(e));
            setPending([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPending();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function act(reimbursementId, action) {
        setActionLoadingId(reimbursementId);
        setErr('');
        try {
            await api.patch('/rest/reimbursements', { reimbursementId, action });
            await fetchPending();
        } catch (e) {
            setErr(getErrorMessage(e));
        } finally {
            setActionLoadingId(null);
        }
    }

    return (
        <div className="py-8">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">APE Dashboard</h1>
                    <p className="text-sm text-gray-600">Approve reimbursements awaiting APE action.</p>
                    <div className="h-4" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">PENDING REIMBURSEMENTS</h2>
                                <p className="text-sm text-gray-600">Waiting for APE approval.</p>
                            </div>

                            <button
                                type="button"
                                onClick={fetchPending}
                                disabled={loading}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                            >
                                {loading ? 'Refreshing…' : 'Refresh'}
                            </button>
                        </div>

                        {err ? (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
                                {err}
                            </div>
                        ) : null}

                        {loading ? (
                            <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
                        ) : pending.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="text-4xl">✅</div>
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
                                            <tr
                                                key={r.reimbursementId ?? r.id ?? idx}
                                                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                            >
                                                <td className="py-3 px-3 text-sm font-semibold text-gray-900">
                                                    {r.employeeName || r.name || 'Employee'}
                                                </td>
                                                <td className="py-3 px-3 text-sm font-semibold text-gray-900">{r.title}</td>
                                                <td className="py-3 px-3 text-sm text-gray-800">₹{Number(r.amount || 0)}</td>
                                                <td className="py-3 px-3 text-sm text-gray-600">
                                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === (r.reimbursementId ?? r.id)}
                                                            onClick={() => act(r.reimbursementId ?? r.id, 'APPROVED')}
                                                            className="inline-flex items-center rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-60"
                                                        >
                                                            {actionLoadingId === (r.reimbursementId ?? r.id) ? '…' : 'Approve'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === (r.reimbursementId ?? r.id)}
                                                            onClick={() => act(r.reimbursementId ?? r.id, 'REJECTED')}
                                                            className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60"
                                                        >
                                                            {actionLoadingId === (r.reimbursementId ?? r.id) ? '…' : 'Reject'}
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

                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900">APE ACTIONS</h2>
                        <p className="text-sm text-gray-600">
                            Approve reimbursements before they are marked as completed.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

