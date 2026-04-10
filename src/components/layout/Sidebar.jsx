import { NavLink } from 'react-router-dom';
import { FiHome, FiUser, FiMessageSquare, FiSettings, FiBell } from 'react-icons/fi';

const Sidebar = () => {
  const navItems = [
    { name: 'Home', path: '/cabinet/dashboard', icon: FiHome },
    { name: 'Chats', path: '/cabinet/chats', icon: FiMessageSquare },
    { name: 'Notifications', path: '/cabinet/notifications', icon: FiBell },
    { name: 'Profile', path: '/cabinet/profile', icon: FiUser },
    { name: 'Settings', path: '/cabinet/settings', icon: FiSettings },
  ];

  return (
    <aside className="w-64 hidden lg:block border-r border-gray-100 flex-shrink-0 min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="sticky top-24 flex flex-col space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-semibold ${
                  isActive
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`
              }
            >
              <Icon size={24} />
              <span className="text-[17px]">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
