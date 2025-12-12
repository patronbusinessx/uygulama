
import { User } from '../types';

const USERS_STORAGE_KEY = 'nebula_users';
const SESSION_STORAGE_KEY = 'nebula_current_user';

export const authService = {
  // Initialize and seed Admin if not exists
  init: () => {
    const users = authService.getUsers();
    const adminExists = users.some(u => u.role === 'admin');
    
    if (!adminExists) {
      const adminUser: User = {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@nebula.ai',
        password: 'admin', // Default password
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff',
        joinedDate: Date.now(),
        role: 'admin',
        membershipTier: 'pro', // Admin is PRO by default
        isBanned: false,
        savedPostIds: [],
        dailyUsageCount: 0,
        lastUsageDate: new Date().toISOString().split('T')[0]
      };
      users.push(adminUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  },

  // Get all registered users
  getUsers: (): User[] => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  },

  // Save a new user
  register: (user: Omit<User, 'id' | 'joinedDate' | 'role' | 'isBanned' | 'savedPostIds' | 'membershipTier'>): { success: boolean; message: string; user?: User } => {
    const users = authService.getUsers();
    
    // Check if username or email already exists
    if (users.some(u => u.username === user.username)) {
      return { success: false, message: 'Username already taken' };
    }
    if (users.some(u => u.email === user.email)) {
      return { success: false, message: 'Email already registered' };
    }

    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      joinedDate: Date.now(),
      avatar: `https://ui-avatars.com/api/?name=${user.username}&background=0D8ABC&color=fff`,
      role: 'user', // Default role
      membershipTier: 'free', // Default tier is FREE
      isBanned: false,
      savedPostIds: [],
      dailyUsageCount: 0,
      lastUsageDate: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    return { success: true, message: 'Registration successful', user: newUser };
  },

  // Authenticate user
  login: (credential: string, password: string): { success: boolean; message: string; user?: User } => {
    // Ensure admin exists
    authService.init();
    
    const users = authService.getUsers();
    
    // Allow login with either username or email
    const user = users.find(u => 
      (u.username === credential || u.email === credential) && u.password === password
    );

    if (user) {
      if (user.isBanned) {
        return { success: false, message: 'This account has been banned.' };
      }

      // Create session (exclude password from session storage)
      const { password, ...safeUser } = user;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
      return { success: true, message: 'Login successful', user: safeUser as User };
    }

    return { success: false, message: 'Invalid credentials' };
  },

  // Get current session
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(SESSION_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  // --- USAGE TRACKING ---
  
  // Checks if user can perform an action (view prompt) and increments count
  checkAndIncrementUsage: (userId: string): { allowed: boolean; reason?: 'limit_reached' } => {
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return { allowed: false };
    
    const user = users[userIndex];
    const today = new Date().toISOString().split('T')[0];
    
    // Pro users have no limits
    if (user.membershipTier === 'pro') {
        return { allowed: true };
    }

    // Reset count if it's a new day
    if (user.lastUsageDate !== today) {
        user.dailyUsageCount = 0;
        user.lastUsageDate = today;
    }

    // Free Tier Limit: 10
    const FREE_LIMIT = 10;
    
    if ((user.dailyUsageCount || 0) >= FREE_LIMIT) {
        return { allowed: false, reason: 'limit_reached' };
    }

    // Increment
    user.dailyUsageCount = (user.dailyUsageCount || 0) + 1;
    
    // Save
    users[userIndex] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update Session
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        authService.updateSessionUser(user);
    }

    return { allowed: true };
  },

  // ADMIN METHODS
  updateUserStatus: (userId: string, isBanned: boolean) => {
    const users = authService.getUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, isBanned } : u);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  },

  updateUserTier: (userId: string, tier: 'free' | 'pro') => {
    const users = authService.getUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, membershipTier: tier } : u);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    // Update session if it's the current user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        authService.updateSessionUser({ ...currentUser, membershipTier: tier });
    }
  },

  deleteUser: (userId: string) => {
    const users = authService.getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  },

  // Update session user data after a change (like saving a post)
  updateSessionUser: (user: User) => {
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
  },

  // Update User Profile (Handles both general and sensitive data)
  updateUser: (
    userId: string, 
    updates: { username?: string; avatar?: string }, 
    security?: { currentPassword?: string; newEmail?: string; newPassword?: string }
  ): { success: boolean; message: string; user?: User } => {
    
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    const currentUser = users[userIndex];
    let updatedUser = { ...currentUser, ...updates };

    // Handle Security Updates (Email/Password)
    if (security && (security.newEmail || security.newPassword)) {
      // 1. Re-authentication check
      if (security.currentPassword !== currentUser.password) {
        return { success: false, message: 'Incorrect current password' };
      }

      // 2. Email uniqueness check
      if (security.newEmail && security.newEmail !== currentUser.email) {
        const emailExists = users.some(u => u.id !== userId && u.email === security.newEmail);
        if (emailExists) {
           return { success: false, message: 'Email is already in use by another account' };
        }
        updatedUser.email = security.newEmail;
      }

      // 3. Password update
      if (security.newPassword) {
        updatedUser.password = security.newPassword;
      }
    }

    // Save updates
    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Update Session
    authService.updateSessionUser(updatedUser);

    // Return user without password
    const { password, ...safeUser } = updatedUser;
    return { success: true, message: 'Profile updated successfully', user: safeUser as User };
  }
};
