import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function getErrorMessage(err) {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.message) return err.message;
    return 'Something went wrong. Please try again.';
}

export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        setSubmitting(true);
        const payload = { name, email, password };

        try {
            await api.post('/rest/onboardings/register', payload);

            // Never keep password longer than needed
            setPassword('');

            navigate('/login?success=' + encodeURIComponent('Account created. Please log in.'));
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
                            <div className="text-sm text-gray-500">Create your account</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h1 className="text-lg font-bold text-gray-900">Register</h1>

                    {error ? (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
                            {error}
                        </div>
                    ) : null}

                    <form className="mt-5" onSubmit={handleSubmit}>
                        <label className="block text-sm font-semibold text-gray-700">Name</label>
                        <input
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                            disabled={submitting}
                        />

                        <label className="mt-4 block text-sm font-semibold text-gray-700">Email</label>
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
                            autoComplete="new-password"
                            disabled={submitting}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {submitting ? 'Creating…' : 'Create account'}
                        </button>
                    </form>

                    <div className="mt-5 text-center text-sm">
                        <span className="text-gray-500">Already have an account?</span>{' '}
                        <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

