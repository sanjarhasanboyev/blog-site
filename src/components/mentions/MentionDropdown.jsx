import React from 'react';

const MentionDropdown = ({ users, onSelect, activeIndex }) => {
  if (!users || users.length === 0) return null;

  return (
    <div className="absolute z-[9999] mt-1 w-60 bg-white/98 backdrop-blur-xl border border-gray-100 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
      <div className="max-h-[280px] overflow-y-auto py-1.5 px-1.5 custom-scrollbar">
        <div className="px-2.5 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50 mb-1">
          Foydalanuvchilar
        </div>
        <div className="space-y-0.5">
          {users.map((user, index) => (
            <button
              key={user.id || user.username}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(user);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left transition-all duration-200 rounded-lg group ${
                index === activeIndex 
                  ? 'bg-black text-white shadow-md' 
                  : 'hover:bg-gray-50 text-gray-700 active:scale-[0.98]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                index === activeIndex 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 border border-gray-100'
              }`}>
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-bold text-[13px] truncate leading-tight ${
                  index === activeIndex ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.name || 'User'}
                </span>
                <span className={`text-[11px] truncate transition-colors ${
                  index === activeIndex ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  @{user.username}
                </span>
              </div>
              {index === activeIndex && (
                <div className="ml-auto w-1 h-1 rounded-full bg-white opacity-60" />
              )}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default MentionDropdown;
