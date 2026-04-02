/* ═══════════════════════════════════════════════════════════
   MERCAPLUS DEMO — Contexto global: carrito, sesión, wishlist
   ═══════════════════════════════════════════════════════════ */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { MpProduct } from "./data";

/* ── Tipos ── */
export interface CartItem {
  product: MpProduct;
  qty: number;
  channel: "public" | "dist";
}

export type MpUser =
  | { type: "guest" }
  | { type: "public";  name: string; email: string; loyaltyPoints: number }
  | { type: "dist";    name: string; company: string; email: string; tier: "bronce" | "plata" | "oro" }
  | { type: "pos";     name: string; location: string }
  | { type: "admin";   name: string };

interface MpContextValue {
  /* Sesión */
  user: MpUser;
  login: (user: MpUser) => void;
  logout: () => void;

  /* Canal activo */
  channel: "public" | "dist" | "pos";
  setChannel: (c: "public" | "dist" | "pos") => void;

  /* Carrito */
  cart: CartItem[];
  addToCart: (product: MpProduct, channel?: "public" | "dist") => void;
  removeFromCart: (productId: string) => void;
  changeQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  /* Wishlist */
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const MpContext = createContext<MpContextValue | null>(null);

export function MpProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MpUser>({ type: "guest" });
  const [channel, setChannel] = useState<"public" | "dist" | "pos">("public");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  /* ── Sesión ── */
  const login = useCallback((u: MpUser) => setUser(u), []);
  const logout = useCallback(() => setUser({ type: "guest" }), []);

  /* ── Carrito ── */
  const addToCart = useCallback((product: MpProduct, ch: "public" | "dist" = "public") => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1, channel: ch }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => {
    const price = i.channel === "dist" ? i.product.priceWholesale : i.product.pricePublic;
    return s + price * i.qty;
  }, 0);

  /* ── Wishlist ── */
  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  return (
    <MpContext.Provider
      value={{
        user, login, logout,
        channel, setChannel,
        cart, addToCart, removeFromCart, changeQty, clearCart, cartCount, cartSubtotal,
        wishlist, toggleWishlist, isWishlisted,
      }}
    >
      {children}
    </MpContext.Provider>
  );
}

export function useMp() {
  const ctx = useContext(MpContext);
  if (!ctx) throw new Error("useMp must be used inside MpProvider");
  return ctx;
}
