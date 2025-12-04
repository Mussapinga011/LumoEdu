import { Timestamp } from 'firebase/firestore';

export type ABTestLocation = 
  | 'challenge_limit_screen'
  | 'study_blocked_screen'
  | 'profile_premium_banner'
  | 'disciplines_page_banner';

export type ABTestStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface ABTestVariant {
  title: string;
  message: string;
  buttonText: string;
  buttonColor?: 'yellow' | 'green' | 'blue' | 'red';
  extraInfo?: string;
  emoji?: string;
}

export interface ABTestResults {
  views: number;
  clicks: number;
  conversions: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  location: ABTestLocation;
  status: ABTestStatus;
  
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  
  results: {
    variantA: ABTestResults;
    variantB: ABTestResults;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface ABTestCreate {
  name: string;
  description?: string;
  location: ABTestLocation;
  variantA: ABTestVariant;
  variantB: ABTestVariant;
}
