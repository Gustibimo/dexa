import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useToast } from '../components/Toast';

interface EmployeeData {
  id?: number;
  name: string;
  email: string;
  position: string;
  phone: string;
  role: string;
  is_active?: boolean;
}

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<EmployeeData>({
    name: '',
    email: '',
    position: '',
    phone: '',
    role: 'employee',
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const { showToast } = useToast();

  useEffect(() => {
    if (isEdit) {
      apiClient.get(`/employees`).then(({ data }) => {
        const emp = data.data.find((e: EmployeeData & { id: number }) => e.id === Number(id));
        if (emp) {
          setForm({
            name: emp.name,
            email: emp.email,
            position: emp.position,
            phone: emp.phone || '',
            role: emp.role,
            is_active: emp.is_active,
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/employees/${id}`, {
          name: form.name,
          position: form.position,
          phone: form.phone || undefined,
          role: form.role,
          is_active: form.is_active,
        });
      } else {
        await apiClient.post('/employees', {
          name: form.name,
          email: form.email,
          password,
          position: form.position,
          phone: form.phone || undefined,
          role: form.role,
        });
      }
      showToast(isEdit ? 'Employee updated' : 'Employee created');
      navigate('/employees');
    } catch {
      setError('Failed to save employee');
      showToast('Failed to save employee', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const newPass = prompt('Enter new password (min 8 characters):');
    if (!newPass || newPass.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    try {
      await apiClient.patch(`/employees/${id}`, { password: newPass });
      showToast('Password reset successfully');
    } catch {
      showToast('Failed to reset password', 'error');
    }
  };

  const handleToggleActive = async () => {
    try {
      await apiClient.patch(`/employees/${id}`, { is_active: !form.is_active });
      setForm((f) => ({ ...f, is_active: !f.is_active }));
      showToast(form.is_active ? 'Employee deactivated' : 'Employee activated');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              required
              disabled={isEdit}
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                required
                minLength={8}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <input
              type="text"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <button
              onClick={handleResetPassword}
              className="w-full py-2.5 border border-orange-300 text-orange-700 font-medium rounded-lg hover:bg-orange-50 transition"
            >
              Reset Password
            </button>
            <button
              onClick={handleToggleActive}
              className={`w-full py-2.5 font-medium rounded-lg transition ${
                form.is_active !== false
                  ? 'border border-red-300 text-red-700 hover:bg-red-50'
                  : 'border border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              {form.is_active !== false ? 'Deactivate Employee' : 'Activate Employee'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
