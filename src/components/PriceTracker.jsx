import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp, where, getDocs, updateDoc } from 'firebase/firestore';

const PriceTracker = ({ roomId }) => {
  const [entries, setEntries] = useState([]);
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [supermarketOption, setSupermarketOption] = useState('');
  const [supermarkets, setSupermarkets] = useState([]);
  const [supermarketsLoading, setSupermarketsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'prices'), where('roomId', '==', roomId), orderBy('createdAt', 'desc'));
    console.debug('PriceTracker: subscribing prices for roomId=', roomId);
    setFetchError(null);
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          // Normalize createdAt / updatedAt: convert Firestore Timestamp to JS Date when possible
          const created = data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || null;
          const updated = data.updatedAt && typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate()
            : data.updatedAt || null;
          arr.push({ id: d.id, ...data, createdAt: created, updatedAt: updated });
        });
      console.debug('PriceTracker: loaded entries for room', roomId, 'count=', arr.length, arr);
      setEntries(arr);
      setSnapshotCount(arr.length);
      setLoading(false);
    }, (err) => {
      console.error('Error loading prices:', err);
      setFetchError(err?.message || String(err));
      setLoading(false);
    });

    return () => unsub();
  }, [roomId]);

  // Load supermarkets list from Firestore collection `supermarkets`
  useEffect(() => {
    setSupermarketsLoading(true);
    const q = query(collection(db, 'supermarkets'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        if (data.name) arr.push({ id: d.id, name: data.name });
      });
      setSupermarkets(arr);
      setSupermarketsLoading(false);
      console.debug('PriceTracker: loaded supermarkets', arr);
    }, (err) => {
      console.error('Error loading supermarkets:', err);
      setSupermarkets([]);
      setSupermarketsLoading(false);
    });
    return () => unsub();
  }, []);

  const addEntry = async (e) => {
    e.preventDefault();
    if (!product.trim() || !price) return;
    // Allow both comma and dot as decimal separator
    const cleaned = String(price).replace(',', '.').trim();
    const numeric = Number(cleaned);
    if (Number.isNaN(numeric)) {
      alert('Precio inválido');
      return;
    }
    try {
      // Determine final supermarket value from selected option and optional custom text
      const finalSupermarket = supermarketOption === 'Otro'
        ? (supermarket.trim() || null)
        : (supermarketOption || null);

      // Check if a product with same name exists in this room -> update instead of create
      const qExist = query(collection(db, 'prices'), where('roomId', '==', roomId), where('product', '==', product.trim()));
      const existing = await getDocs(qExist);
      if (!existing.empty) {
        // update first matching doc
        const first = existing.docs[0];
        await updateDoc(doc(db, 'prices', first.id), {
          price: numeric,
          supermarket: finalSupermarket,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'prices'), {
          product: product.trim(),
          price: numeric,
          supermarket: finalSupermarket,
          roomId,
          createdAt: serverTimestamp()
        });
      }
      setProduct('');
      setPrice('');
      setSupermarket('');
      setSupermarketOption('');
    } catch (err) {
      console.error('Error adding price entry:', err);
      alert('Error añadiendo precio. Revisa la consola.');
    }
  };

  const deleteEntry = async (id) => {
    try {
      await deleteDoc(doc(db, 'prices', id));
    } catch (err) {
      console.error('Error deleting price entry:', err);
    }
  };

  const addToShoppingList = async (entry) => {
    try {
      await addDoc(collection(db, 'items'), {
        name: entry.product,
        completed: false,
        createdAt: serverTimestamp(),
        roomId: roomId
      });
    } catch (err) {
      console.error('Error adding price entry to shopping list:', err);
      alert('No se pudo añadir a la lista. Revisa la consola.');
    }
  };

  const euroFmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="price-tracker">
      <h2>Registro de Precios 💲</h2>

      <form onSubmit={addEntry} className="add-price-form">
        <input
          type="text"
          placeholder="Producto"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <select value={supermarketOption} onChange={(e) => setSupermarketOption(e.target.value)}>
          <option value="">-- Supermercado --</option>
          {!supermarketsLoading && supermarkets.length > 0 ? (
            supermarkets.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)
          ) : (
            // fallback hardcoded list while DB is empty or loading
            <>
              <option value="Dia">Dia</option>
              <option value="Ahorramas">Ahorramas</option>
              <option value="Mercadona">Mercadona</option>
              <option value="Aldi">Aldi</option>
              <option value="Carrefour">Carrefour</option>
            </>
          )}
          <option value="Otro">Otro</option>
        </select>

        {/* If 'Otro' selected, allow free text input */}
        {supermarketOption === 'Otro' && (
          <input
            type="text"
            placeholder="Introduce supermercado"
            value={supermarket}
            onChange={(e) => setSupermarket(e.target.value)}
          />
        )}

        <button type="submit">Añadir precio</button>
      </form>

      {loading ? (
        <p>Cargando precios...</p>
      ) : (
        <ul className="price-entries">
          {entries.map((en) => (
            <li key={en.id} className="price-entry">
              <div className="price-row">
                <div className="price-left">
                  <strong>{en.product}</strong>
                  <div className="meta">
                    {en.supermarket ? <span className="meta-super">{en.supermarket}</span> : null}
                    {en.createdAt ? (
                      <span className="meta-date">{dateFmt.format(en.createdAt)}</span>
                    ) : null}
                  </div>
                </div>
                <div className="price-right">{typeof en.price === 'number' ? euroFmt.format(en.price) : en.price}</div>
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button className="add-to-list-btn" onClick={() => addToShoppingList(en)}>＋ Añadir</button>
                <button className="delete-btn" onClick={() => deleteEntry(en.id)}>🗑️</button>
              </div>
            </li>
          ))}
          {entries.length === 0 && <p className="empty-state">No hay precios registrados todavía.</p>}
        </ul>
      )}
      {/* Diagnostics when no entries shown */}
      {!loading && snapshotCount !== null && snapshotCount === 0 && (
        <div className="debug-note" style={{marginTop:12, color:'#9aa0b4', fontSize:12}}>
          <div>No se encontraron entradas para `roomId`: <strong>{String(roomId)}</strong></div>
          <div>Documentos llegados desde Firestore: {snapshotCount}</div>
          {fetchError && <div style={{color:'#ff9aa2'}}>Error: {fetchError}</div>}
          <div>Revisa la consola del navegador para ver el array cargado y errores (console.debug/console.error).</div>
        </div>
      )}
    </div>
  );
};

export default PriceTracker;
