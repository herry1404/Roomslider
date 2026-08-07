import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();

  // array of wishlisted room IDs (strings) for quick lookup
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistIds([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      console.log("Wishlist Response:", res.data);

      const ids = (res.data.wishlist || []).map((room) => room._id);
      setWishlistIds(ids);
    } catch (error) {
      console.error("FETCH WISHLIST ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // refetch whenever the logged-in user changes (login/logout)
  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isWishlisted = (roomId) => wishlistIds.includes(roomId);

  const addToWishlist = async (roomId) => {
    if (!user) {
      toast.error("Please login to add to wishlist");
      return;
    }

    try {
      // optimistic update
      setWishlistIds((prev) => [...prev, roomId]);

      await api.post(`/wishlist/${roomId}`);
    } catch (error) {
      console.error("ADD WISHLIST ERROR:", error);
      // rollback on failure
      setWishlistIds((prev) => prev.filter((id) => id !== roomId));
      toast.error("Could not add to wishlist");
    }
  };

  const removeFromWishlist = async (roomId) => {
    try {
      // optimistic update
      setWishlistIds((prev) => prev.filter((id) => id !== roomId));

      await api.delete(`/wishlist/${roomId}`);
    } catch (error) {
      console.error("REMOVE WISHLIST ERROR:", error);
      // rollback on failure
      setWishlistIds((prev) => [...prev, roomId]);
      toast.error("Could not remove from wishlist");
    }
  };

  const toggleWishlist = async (roomId) => {
    if (isWishlisted(roomId)) {
      await removeFromWishlist(roomId);
    } else {
      await addToWishlist(roomId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        loading,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refetchWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
