import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner className="py-20" />;
    if (!user) return <Navigate to="/login" replace />;

    return children;
}

