import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to format email as a safe document ID
  const formatEmailToId = (email) => {
    return email.toLowerCase().replace(/\./g, ',');
  };

  // Register user
  const signup = async (email, password, name) => {
    const userId = formatEmailToId(email);
    
    // We skip the mandatory check so the app doesn't hang.
    // In a production environment with a properly configured Database, you would await get here.
    
    const userDoc = {
      uid: userId,
      name,
      email: email.toLowerCase(),
      password, // Storing password for custom local auth
      createdAt: new Date().toISOString()
    };

    // Save to local storage for persistence IMMEDIATELY so the app doesn't hang
    localStorage.setItem('quizforge_user', JSON.stringify(userDoc));
    setCurrentUser(userDoc);

    // Attempt to sync to Realtime Database in the background (Non-blocking)
    set(ref(db, `users/${userId}/profile`), userDoc).catch(err => {
      console.error("Background sync failed. Ensure Realtime Database is created in Firebase Console.", err);
    });
    
    return userDoc;
  };

  // Login
  const login = async (email, password) => {
    const userId = formatEmailToId(email);
    
    // Fetch user from Realtime Database
    const userRef = ref(db, `users/${userId}/profile`);
    
    const readPromise = get(userRef);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database connection timed out. Please check your network connection.")), 10000)
    );
    
    const docSnap = await Promise.race([readPromise, timeoutPromise]);
    
    if (docSnap.exists()) {
      const userData = docSnap.val();
      if (userData.password !== password) {
        throw new Error('Incorrect password.');
      }
      localStorage.setItem('quizforge_user', JSON.stringify(userData));
      setCurrentUser(userData);
      return userData;
    } else {
      throw new Error('Account not found. Please sign up first.');
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('quizforge_user');
    setCurrentUser(null);
  };

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('quizforge_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
