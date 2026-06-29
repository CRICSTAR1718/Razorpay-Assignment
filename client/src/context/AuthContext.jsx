import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = React.createContext(null);

const AUTH_STORAGE_KEY = 'reimburseflow_user_v1';

function getUserFromStorage() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.userId) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => getUserFromStorage());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage, then verify cookie validity.
        // Backend spec: cookie-based auth, so we must call an auth-protected endpoint.
        // Your task spec says "call GET /rest/employees to check if user is logged in".

        let cancelled = false;

        async function init() {
            setLoading(true);
            const stored = getUserFromStorage();
            if (stored) setUser(stored);

            try {
                // This endpoint should be protected by cookie auth.
                await api.get('/rest/employees');
                if (cancelled) return;
                // Keep stored user (role routing depends on it).
                setUser((prev) => prev || stored);
            } catch {
                if (cancelled) return;
                localStorage.removeItem(AUTH_STORAGE_KEY);
                setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        init();

        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo(() => {
        async function login(userData) {
            setUser(userData);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        }

        async function logout() {
            setLoading(true);
            try {
                // Backend exists per spec. Even if it fails, we clear client state.
                await api.post('/rest/onboardings/logout');
            } catch {
                // ignore
            } finally {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                setUser(null);
                setLoading(false);
                navigate('/login', { replace: true });
            }
        }

        return {
            user,
            loading,
            login,
            logout,
        };
    }, [navigate, user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

