import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const load = () =>
    api
      .get('/wishlist')
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]));

  useEffect(() => {
    if (user) load();
    else setItems([]);
  }, [user]);

  const toggle = async (listingId) => {
    await api.post(`/wishlist/${listingId}`);
    await load();
  };

  const has = (listingId) => items.some((l) => l._id === listingId);

  return (
    <WishlistContext.Provider value={{ items, toggle, has, reload: load }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
