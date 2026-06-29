import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_TO_PATH = {
    EMP: '/dashboard/emp',
    RM: '/dashboard/rm',
    APE: '/dashboard/ape',
    CFO: '/dashboard/cfo',
};

function getErrorMessage(err) {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.response?.data?.error?.message) return err.response.data.error.message;
    if (err?.message) return err.message;
    return 'Something went wrong. Please try again.';
}

export default function Login() {
    const navigate = useNavigate();
    const { login, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // If you redirected with a message query param in future.
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('success');
        if (msg) setSuccess(msg);
    }, []);

    useEffect(() => {
        if (user?.role) {
            navigate(ROLE_TO_PATH[user.role] || '/dashboard/emp', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        setSubmitting(true);
        const payload = { email, password };

        try {
            const res = await api.post('/rest/onboardings/login', payload);
            const userData = res?.data?.data;

            if (!userData?.role) {
                throw new Error('Login succeeded but user data is missing.');
            }

            await login(userData);

            // Never keep password longer than needed
            setPassword('');

            navigate(ROLE_TO_PATH[userData.role] || '/dashboard/emp', { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">RF</div>
                        <div>
                            <div className="text-xl font-bold text-gray-900">ReimburseFlow</div>
                            <div className="text-sm text-gray-500">Sign in to manage reimbursements</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h1 className="text-lg font-bold text-gray-900">Login</h1>

                    {success ? (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-semibold">
                            {success}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
                            {error}
                        </div>
                    ) : null}

                    <form className="mt-5" onSubmit={handleSubmit}>
                        <label className="block text-sm font-semibold text-gray-700">Email</label>
                        <input
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="you@org.com"
                            disabled={submitting}
                        />

                        <label className="mt-4 block text-sm font-semibold text-gray-700">Password</label>
                        <input
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={submitting}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-5 text-center text-sm">
                        <span className="text-gray-500">New to ReimburseFlow?</span>{' '}
                        <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

