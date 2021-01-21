import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);

      if (product) {
        if (product.quantity - 1 < 1) {
          const newProducts = products.filter(p => p.id !== id);

          setProducts(newProducts);

          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(newProducts),
          );
        } else {
          const newProducts = products.map(p =>
            p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
          );

          setProducts(newProducts);

          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(newProducts),
          );
        }
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productAlreadyOnCart = products.find(p => p.id === product.id);

      if (productAlreadyOnCart) {
        increment(product.id);
        return;
      }

      const newProducts = [...products, { ...product, quantity: 1 }];

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
