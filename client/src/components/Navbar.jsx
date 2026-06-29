import { useAuth } from '../context/AuthContext';

const ROLE_BADGE = {
    EMP: 'bg-blue-100 text-blue-800 border-blue-200',
    RM: 'bg-purple-100 text-purple-800 border-purple-200',
    APE: 'bg-orange-100 text-orange-800 border-orange-200',
    CFO: 'bg-red-100 text-red-800 border-red-200',
};

function roleToLabel(role) {
    return role || '—';
}

export default function Navbar() {
    const { user, logout } = useAuth();

    const roleStyle = ROLE_BADGE[user?.role] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
        <header className="bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">RF</div>
                    <div className="leading-tight">
                        <div className="text-lg font-bold text-gray-900">ReimburseFlow</div>
                        <div className="text-xs text-gray-500">Reimbursements Management</div>
                    </div>
                </div>

                {user ? (
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                        </div>

                        <span
                            className={`hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${roleStyle}`}
                        >
                            {roleToLabel(user.role)}
                        </span>

                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                        >
                            Logout
                        </button>
                    </div>
                ) : null}
            </div>
        </header>
    );
}

