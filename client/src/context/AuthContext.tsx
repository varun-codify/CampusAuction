import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../../shared/types.js';
import { api, socket } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  testAccounts: User[];
  login: (credential: string, password?: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    studentId: string;
    campus?: string;
    hall?: string;
    phone?: string;
    password: string;
    role?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  unreadCount: 0,
  testAccounts: [],
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
  switchUser: async () => {},
  refreshNotifications: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [testAccounts, setTestAccounts] = useState<User[]>([]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('campus_bid_token');
      const userId = localStorage.getItem('campus_bid_user_id');
      if (!token && !userId) {
        setUser(null);
        return;
      }

      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('campus_bid_user_id', currentUser.id);

      // Join socket user channel
      socket.emit('join:user', currentUser.id);

      // Load unread notifications
      const notifs = await api.getNotifications();
      setUnreadCount(notifs.unreadCount);
    } catch (err) {
      console.log('No valid session active, starting guest mode.');
      localStorage.removeItem('campus_bid_token');
      localStorage.removeItem('campus_bid_user_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credential: string, password?: string): Promise<User> => {
    const res = await api.login(credential, password);
    localStorage.setItem('campus_bid_token', res.token);
    localStorage.setItem('campus_bid_user_id', res.user.id);
    setUser(res.user);

    if (user?.id) {
      socket.emit('leave:user', user.id);
    }
    socket.emit('join:user', res.user.id);

    await refreshNotifications();
    return res.user;
  };

  const register = async (payload: {
    name: string;
    email: string;
    studentId: string;
    campus?: string;
    hall?: string;
    phone?: string;
    password: string;
    role?: string;
  }): Promise<User> => {
    const res = await api.register(payload);
    localStorage.setItem('campus_bid_token', res.token);
    localStorage.setItem('campus_bid_user_id', res.user.id);
    setUser(res.user);

    if (user?.id) {
      socket.emit('leave:user', user.id);
    }
    socket.emit('join:user', res.user.id);

    await refreshNotifications();
    return res.user;
  };

  const logout = async () => {
    if (user?.id) {
      socket.emit('leave:user', user.id);
    }
    await api.logout();
    setUser(null);
    setUnreadCount(0);
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setUnreadCount(notifs.unreadCount);
    } catch (err) {
      console.error('Error refreshing notifications:', err);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const { user: newUser, token } = await api.switchUser(userId);
      localStorage.setItem('campus_bid_token', token);
      localStorage.setItem('campus_bid_user_id', newUser.id);
      setUser(newUser);
      
      // Re-join socket channel
      socket.emit('leave:user', user?.id);
      socket.emit('join:user', newUser.id);

      await refreshNotifications();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  useEffect(() => {
    loadUser();

    // Listen for real-time notifications on socket
    socket.on('notification:new', (notif) => {
      setUnreadCount((prev) => prev + 1);
      // Optional browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.message });
      }
    });

    return () => {
      socket.off('notification:new');
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadCount,
        testAccounts,
        login,
        register,
        logout,
        switchUser: handleSwitchUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
