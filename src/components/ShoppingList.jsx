import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc, where } from 'firebase/firestore';

const ShoppingList = ({ pin, onLogout }) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        if (!pin) {
            // no room id provided -> empty list
            setItems([]);
            setLoading(false);
            return;
        }

        const roomId = pin; // prop is roomId (keeps prop name for compatibility)
        const q = query(collection(db, 'items'), where('roomId', '==', roomId), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const itemsArr = [];
            querySnapshot.forEach((doc) => {
                itemsArr.push({ ...doc.data(), id: doc.id });
            });
            console.log('ShoppingList snapshot for roomId', roomId, itemsArr);
            setFetchError(null);
            setItems(itemsArr);
            setLoading(false);
        }, (error) => {
            console.error("Error getting documents: ", error);
            setFetchError(error.message);
            alert("Error leyendo lista: " + error.message);
            // Fallback for demo if firebase fails (e.g. no config)
            setLoading(false);
        });
        return () => unsubscribe();
    }, [pin]);

    const addItem = async (e) => {
        e.preventDefault();
        if (newItem.trim() === '') return;
        try {
            await addDoc(collection(db, 'items'), {
                name: newItem.trim(),
                completed: false,
                createdAt: serverTimestamp(),
                roomId: pin // associate item with current room id
            });
            setNewItem('');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error al añadir. ¿Configuraste Firebase?");
        }
    };

    // debug helper removed: items without roomId will no longer be scanned from the UI

    const deleteItem = async (id) => {
        try {
            await deleteDoc(doc(db, 'items', id));
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const toggleComplete = async (item) => {
        try {
            await updateDoc(doc(db, 'items', item.id), {
                completed: !item.completed
            });
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    return (
        <div className="shopping-list-container">
            <header className="shopping-header">
                        <h1>Lista de la Compra 🛒</h1>
                        {onLogout && (
                            <button className="logout-btn" onClick={() => {
                                if (window.confirm('¿Cerrar sesión?')) onLogout();
                            }}>Cerrar sesión</button>
                        )}
                    </header>

            {/* debug controls removed */}

            <form onSubmit={addItem} className="add-item-form">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="¿Qué necesitamos?"
                />
                <button type="submit">Añadir</button>
            </form>

            {fetchError && <p className="error-message">Error leyendo lista: {fetchError}</p>}

            {loading ? (
                <p className="loading">Cargando lista...</p>
            ) : (
                <ul className="items-list">
                    {items.map((item) => (
                        <li key={item.id} className={item.completed ? 'completed' : ''}>
                            <div className="item-content" onClick={() => toggleComplete(item)}>
                                <span className="checkbox">{item.completed ? '✓' : ''}</span>
                                <span className="item-name">{item.name}</span>
                            </div>
                            <button onClick={() => deleteItem(item.id)} className="delete-btn">
                                🗑️
                            </button>
                        </li>
                    ))}
                    {items.length === 0 && !loading && (
                        <p className="empty-state">La lista está vacía. ¡Añade algo!</p>
                    )}
                </ul>
            )}
        </div>
    );
};

export default ShoppingList;
