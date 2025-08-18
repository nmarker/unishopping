import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: AngularFirestore) {}

  getProducts(): Observable<Product[]> {
    return this.firestore.collection<Product>('products').valueChanges({ idField: 'id' });
  }

  addProduct(product: Product): Promise<any> {
    return this.firestore.collection('products').add(product);
  }

  updateProduct(id: string, product: Partial<Product>): Promise<void> {
    return this.firestore.collection('products').doc(id).update(product);
  }

  deleteProduct(id: string): Promise<void> {
    return this.firestore.collection('products').doc(id).delete();
  }
}