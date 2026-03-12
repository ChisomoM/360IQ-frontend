// Firebase auth removed — provide no-op fallbacks so imports remain valid

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const signInWithFirebase = async (_email: string, _password: string) => {
  console.warn('Firebase auth removed: signInWithFirebase is a no-op');
  return null;
};

export const signUpWithFirebase = async (_email: string, _password: string, _displayName?: string) => {
  console.warn('Firebase auth removed: signUpWithFirebase is a no-op');
  return null;
};

export const signOutFromFirebase = async () => {
  console.warn('Firebase auth removed: signOutFromFirebase is a no-op');
};

export const onAuthStateChange = (_callback: (user: FirebaseUser | null) => void) => {
  console.warn('Firebase auth removed: onAuthStateChange is a no-op');
  return () => {};
};

export const convertFirebaseUser = (_user: any): FirebaseUser => {
  return { uid: '', email: null, displayName: null, photoURL: null };
};