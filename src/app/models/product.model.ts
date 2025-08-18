export interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  images?: string[];
  category: string;
  inStock: boolean;
}