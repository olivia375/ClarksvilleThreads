import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult
} from 'firebase/auth';
import { auth, googleProvider, API_URL } from './firebase-config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch user profile from backend
  const fetchUserProfile = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      return {
        ...userData,
        // Include Firebase auth data
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        full_name: userData.full_name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
        picture: userData.picture || firebaseUser.photoURL
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Return basic user data from Firebase
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        picture: firebaseUser.photoURL
      };
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    // Safety timeout - if auth never resolves, stop loading anyway
    const timeout = setTimeout(() => {
      setIsLoadingAuth(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      try {
        if (firebaseUser) {
          const userData = await fetchUserProfile(firebaseUser);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthError({
          type: 'auth_error',
          message: error.message
        });
      } finally {
        setIsLoadingAuth(false);
      }
    });

    // Check for redirect result (for mobile/popup blocked scenarios)
    getRedirectResult(auth).catch((error) => {
      if (error.code !== 'auth/null-user') {
        console.error('Redirect result error:', error);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // Sign in with Google - uses redirect when in an iframe or when COOP blocks popups
  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      // In iframe environments, COOP headers block popup <-> opener communication.
      // Fall straight through to redirect to avoid the console warnings.
      const inIframe = window.self !== window.top;
      if (inIframe) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      // If popup is blocked or closed for any reason, fall back to redirect
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setAuthError({
        type: 'sign_in_error',
        message: error.message
      });
      throw error;
    }
  };

  // Sign out
  const logout = async (shouldRedirect = true) => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      if (shouldRedirect) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Navigate to login (trigger Google sign-in)
  const navigateToLogin = () => {
    signInWithGoogle();
  };

  // Update user profile
  const updateMe = async (updates) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const updatedUser = await response.json();
    setUser(prev => ({ ...prev, ...updatedUser }));
    return updatedUser;
  };

  // Get current auth token
  const getToken = async () => {
    if (!auth.currentUser) {
      return null;
    }
    return auth.currentUser.getIdToken();
  };

  // Refresh user data
  const refreshUser = async () => {
    if (auth.currentUser) {
      const userData = await fetchUserProfile(auth.currentUser);
      setUser(userData);
      return userData;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false, // Not needed for Firebase
      authError,
      appPublicSettings: null, // Not needed for Firebase
      logout,
      navigateToLogin,
      signInWithGoogle,
      updateMe,
      getToken,
      refreshUser,
      checkAppState: refreshUser // Alias for compatibility
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
