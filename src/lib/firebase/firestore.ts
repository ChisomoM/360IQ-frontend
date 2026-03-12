// Stub Firebase Firestore adapter — returns safe empty values after removing Firebase.
// This keeps existing imports working while the project migrates away from Firebase.

export class FirebaseFirestore {
  static async getDocument(_collectionName: string, _docId: string) {
    return null;
  }

  static async getCollection(_collectionName: string, _constraints: any[] = []) {
    return [];
  }

  static async addDocument(_collectionName: string, _data: any) {
    console.warn('Firebase removed: addDocument no-op');
    return null;
  }

  static async updateDocument(_collectionName: string, _docId: string, _data: any) {
    console.warn('Firebase removed: updateDocument no-op');
  }

  static async setDocument(_collectionName: string, _docId: string, _data: any) {
    console.warn('Firebase removed: setDocument no-op');
  }

  static async deleteDocument(_collectionName: string, _docId: string) {
    console.warn('Firebase removed: deleteDocument no-op');
  }

  // Query helpers placeholders
  static where = (_field: string, _op: string, _value: any) => {
    return null;
  };
  static orderBy = (_field: string, _dir?: string) => {
    return null;
  };
  static limit = (_n: number) => {
    return null;
  };
}
