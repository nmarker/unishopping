import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  collectionData, 
  docData 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  // Add a new product (returns Promise)
  async addProduct(product: Product): Promise<string> {
    const productsCollection = collection(this.firestore, 'products');
    const docRef = await addDoc(productsCollection, product);
    return docRef.id;
  }

  // Update an existing product (returns Promise)
  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const productDoc = doc(this.firestore, `products/${id}`);
    return updateDoc(productDoc, product);
  }

  // Delete a product (returns Promise)
  async deleteProduct(id: string): Promise<void> {
    const productDoc = doc(this.firestore, `products/${id}`);
    return deleteDoc(productDoc);
  }

  // Get all products (returns Observable)
  getProducts(): Observable<Product[]> {
    const productsCollection = collection(this.firestore, 'products');
    return collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  // Get a single product by ID (returns Observable)
  getProduct(id: string): Observable<Product | undefined> {
    const productDoc = doc(this.firestore, `products/${id}`);
    return docData(productDoc, { idField: 'id' }) as Observable<Product | undefined>;
  }
}