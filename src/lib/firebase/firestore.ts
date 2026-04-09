// Stub Firebase implementation - legacy code to be removed
export class FirebaseFirestore {
  static async addDoc(collection: string, data: any) {
    console.warn('FirebaseFirestore.addDoc called - legacy implementation');
    return { id: 'stub-' + Date.now() };
  }

  static async updateDoc(docRef: any, data: any) {
    console.warn('FirebaseFirestore.updateDoc called - legacy implementation');
  }

  static async deleteDoc(docRef: any) {
    console.warn('FirebaseFirestore.deleteDoc called - legacy implementation');
  }

  static async getDoc(docRef: any) {
    console.warn('FirebaseFirestore.getDoc called - legacy implementation');
    return { exists: () => false, data: () => null };
  }

  static async getDocs(query: any) {
    console.warn('FirebaseFirestore.getDocs called - legacy implementation');
    return { docs: [] };
  }

  static collection(db: any, path: string) {
    return { path };
  }

  static doc(db: any, path: string) {
    return { path };
  }

  static query(collection: any, ...constraints: any[]) {
    return { collection, constraints };
  }

  static where(field: string, op: string, value: any) {
    return { field, op, value };
  }

  static orderBy(field: string, direction: string = 'asc') {
    return { field, direction };
  }

  static limit(n: number) {
    return { n };
  }
}