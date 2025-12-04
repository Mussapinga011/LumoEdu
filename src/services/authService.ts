import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../stores/useAuthStore';
import { createUserProfile, getUserProfile } from './dbService';
import { UserProfile } from '../types/user';

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: name });

    const newUser: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: name,
      isPremium: false,
      role: 'user',
      xp: 0,
      level: 1,
      streak: 0,
      lastStudyDate: null,
      lastExamDate: null,
      lastChallengeDate: null,
      dailyExercisesCount: 0,
      examsCompleted: 0,
      challengesCompleted: 0,
      averageGrade: 0,
      score: 0
    };

    await createUserProfile(newUser);
    
    // Immediately update the auth store to prevent race condition
    useAuthStore.getState().setUser(newUser);
    
    return newUser;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getUserProfile(userCredential.user.uid);
    
    // Immediately update the auth store to prevent race condition
    if (userProfile) {
      useAuthStore.getState().setUser(userProfile);
    }
    
    return userProfile;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    useAuthStore.getState().setUser(null);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export const initAuthListener = () => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    const { setUser, setLoading } = useAuthStore.getState();
    if (firebaseUser) {
      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // Handle case where user exists in Auth but not Firestore (shouldn't happen normally)
          console.error("User profile not found in Firestore");
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  });
};
