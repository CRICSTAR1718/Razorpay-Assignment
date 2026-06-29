import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';

function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.error?.message) return err.response.data.error.message;
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export default function EMPDashboard() {
  const { user } = useAuth();

  const [form, setForm] = useState({ title: '', description: '', amount: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [reimbursements, setReimbursements] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchReimbursements() {
    setListError('');
    try {
      const res = await api.get('/rest/reimbursements');
      setReimbursements(res?.data?.data || []);
    } catch (err) {
      setListError(getErrorMessage(err));
      setReimbursements([]);
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchReimbursements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitLoading(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
      };

      await api.post('/rest/reimbursements', payload);

      setSubmitSuccess('Reimbursement raised successfully.');
      setForm({ title: '', description: '', amount: '' });
      await fetchReimbursements();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'EMP'}</h2>
        <p className="text-gray-600">Raise reimbursements and track their status.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Raise */}
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">RAISE REIMBURSEMENT</h3>
              <p className="text-sm text-gray-500">Submit details for quick approval.</p>
            </div>
          </div>

          <form className="mt-5" onSubmit={handleSubmit}>
            {submitError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
                {submitError}
              </div>
            ) : null}
            {submitSuccess ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-semibold">
                {submitSuccess}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Title</label>
                <input
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  disabled={submitLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Amount</label>
                <input
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                  disabled={submitLoading}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[96px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required
                disabled={submitLoading}
              />
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="" />
                    Submitting…
                  </span>
                ) : (
                  'Submit reimbursement'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* My reimbursements */}
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">MY REIMBURSEMENTS</h3>
              <p className="text-sm text-gray-500">Track progress from pending to final decision.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoadingList(false);
                setRefreshing(true);
                fetchReimbursements();
              }}
              disabled={refreshing}
              className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {listError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
              {listError}
            </div>
          ) : null}

          <div className="mt-5">
            {loadingList ? (
              <div className="py-10 flex justify-center">
                <Spinner />
              </div>
            ) : reimbursements.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl">🧾</div>
                <div className="mt-2 font-bold text-gray-900">No reimbursements yet</div>
                <div className="text-sm text-gray-500">Raise one above to start the workflow.</div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-600">
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reimbursements.map((r) => (
                      <tr key={r.reimbursementId || r.id} className="odd:bg-white even:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.title}</td>
                        <td className="px-4 py-3 text-gray-700">{r.description}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">₹{r.amount}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

