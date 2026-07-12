import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import RecordForm from './pages/RecordForm';
import RecordView from './pages/RecordView';
import ReportPreview from './pages/ReportPreview';
import TorqueForm from './pages/TorqueForm';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/share/:token" element={<RecordView shareMode />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records/new" element={<RecordForm />} />
            <Route path="/records/:id/edit" element={<RecordForm />} />
            <Route path="/records/:id/view" element={<RecordView />} />
            <Route path="/records/:id/report" element={<ReportPreview />} />
            <Route path="/torque/new" element={<TorqueForm />} />
            <Route path="/torque/:id/edit" element={<TorqueForm />} />
          </Route>
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-slate-500">Page not found.</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}