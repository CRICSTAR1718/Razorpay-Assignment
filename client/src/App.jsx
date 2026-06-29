import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import EMPDashboard from './pages/dashboards/EMPDashboard';
import RMDashboard from './pages/dashboards/RMDashboard';
import APEDashboard from './pages/dashboards/APEDashboard';
import CFODashboard from './pages/dashboards/CFODashboard';

function AppShell() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {user ? <Navbar /> : null}
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard/emp"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["EMP"]}>
                                <EMPDashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/rm"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["RM"]}>
                                <RMDashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/ape"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["APE"]}>
                                <APEDashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/cfo"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["CFO"]}>
                                <CFODashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppShell />
            </AuthProvider>
        </BrowserRouter>
    );
}

