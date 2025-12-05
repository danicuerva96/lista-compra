import React, { useState, useEffect } from 'react';
import { signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import PinLogin from './components/PinLogin';
import ShoppingList from './components/ShoppingList';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // store current room/document id (not the secret code)
  const [currentRoomId, setCurrentRoomId] = useState(null);

  // Check if previously authenticated in this session
  useEffect(() => {
    const storedRoom = sessionStorage.getItem('auth_room_id');
    if (storedRoom) {
      // Try to restore firebase session or just sign in again
      signInAnonymously(auth).then(() => {
        setIsAuthenticated(true);
        setCurrentRoomId(storedRoom);
      }).catch((error) => {
        console.error("Auto-login failed", error);
        sessionStorage.removeItem('auth_room_id');
      });
    }
  }, []);

  const handleLogin = (code) => {
    // For now validate the PIN in clear: look for document codes/{code}
    signInAnonymously(auth).then(async () => {
      try {
        const codeRef = doc(db, 'codes', code);
        const snap = await getDoc(codeRef);
        if (!snap.exists()) {
          await signOut(auth);
          setIsAuthenticated(false);
          setCurrentRoomId(null);
          alert('Código no reconocido o desactivado.');
          return;
        }

        const data = snap.data() || {};
        if (data.active === false) {
          await signOut(auth);
          setIsAuthenticated(false);
          setCurrentRoomId(null);
          alert('El código existe pero está desactivado.');
          return;
        }

        // mark authenticated and store room id (document id = code)
        setIsAuthenticated(true);
        setCurrentRoomId(code);
        sessionStorage.setItem('auth_room_id', code);

        // update lastActive timestamp
        try {
          await setDoc(doc(db, 'codes', code), {
            ...data,
            lastActive: serverTimestamp(),
            active: typeof data.active !== 'undefined' ? data.active : true
          }, { merge: true });
        } catch (e) {
          console.warn('No se pudo actualizar lastActive para la room:', e);
        }

      } catch (error) {
        console.error('Error validando código en Firestore:', error);
        await signOut(auth);
        alert('Error validando código. Revisa la consola.');
      }
    }).catch((error) => {
      console.error("Login failed", error);
      alert("Error conectando con Firebase: " + error.message);
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Error signing out:', e);
    }
    setIsAuthenticated(false);
    setCurrentRoomId(null);
    sessionStorage.removeItem('auth_room_id');
  };

  return (
    <div className="app-container">
      {!isAuthenticated ? (
        <PinLogin onLogin={handleLogin} />
      ) : (
        <ShoppingList pin={currentRoomId} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
