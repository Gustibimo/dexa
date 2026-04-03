import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import ProfileEditForm from './ProfileEditForm';

interface Employee {
  id: number;
  name: string;
  email: string;
  photo_url: string | null;
  position: string;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get('/employees/me');
      setEmployee(data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaved = () => {
    setEditing(false);
    fetchProfile();
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading profile...</div>;
  }

  if (!employee) {
    return <div className="text-center py-10 text-red-500">Failed to load profile</div>;
  }

  if (editing) {
    return <ProfileEditForm employee={employee} onCancel={() => setEditing(false)} onSaved={handleSaved} />;
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={employee.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                {employee.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{employee.name}</h2>
            <p className="text-gray-500">{employee.position}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="text-gray-800">{employee.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Phone</label>
            <p className="text-gray-800">{employee.phone || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Role</label>
            <p className="text-gray-800 capitalize">{employee.role}</p>
          </div>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="mt-6 w-full py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
