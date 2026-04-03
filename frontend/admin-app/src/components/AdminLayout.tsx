import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';

interface AdminLayoutProps {
  employeeName: string;
  onLogout: () => void;
  children?: React.ReactNode;
}

export default function AdminLayout({ employeeName, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const sidebarItems = [
    { to: '/employees', label: 'Employees', icon: '👥' },
    { to: '/attendance', label: 'Attendance', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white shadow-sm flex-col border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">Admin HRD</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">{employeeName}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Desktop header */}
        <header className="hidden md:flex bg-white shadow-sm border-b border-gray-200 px-6 py-3 items-center justify-end gap-3">
          <NotificationBell />
          <span className="text-sm text-gray-600">{employeeName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </header>

        {/* Mobile header */}
        <header className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Admin HRD</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-gray-600">{employeeName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex space-x-2 overflow-x-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
