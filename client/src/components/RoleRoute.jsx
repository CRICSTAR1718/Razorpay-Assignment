import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_TO_PATH = {
    EMP: '/dashboard/emp',
    RM: '/dashboard/rm',
    APE: '/dashboard/ape',
    CFO: '/dashboard/cfo',
};

export default function RoleRoute({ allowedRoles = [], children }) {
    const { user } = useAuth();

    const userRole = user?.role;
    const ok = userRole && allowedRoles.includes(userRole);

    if (ok) return children;

    const redirect = ROLE_TO_PATH[userRole] || '/login';
    return <Navigate to={redirect} replace />;
}

