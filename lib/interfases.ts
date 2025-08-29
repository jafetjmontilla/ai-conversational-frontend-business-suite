export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  plan: string;
  active: boolean;
  emailVerified: boolean;
  photoURL: string;
  updatedAt: string;
  createdAt: string;
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  tiktok?: string;
}

export interface Branch {
  name: string;
  address: string;
  country: string;
  locality: string;
  manager: string;
  phoneNumber?: string;
  isActive: boolean;
}

export interface Business {
  _id: string;
  name: string;
  ownerId: string;
  country: string;
  isChain: boolean;
  slug: string;
  logo?: string;
  description?: string;
  address: string;
  phoneNumber: string;
  socialMedia: SocialMedia;
  branches: Branch[];
  activeBranches: Branch[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInput {
  name?: string;
  country?: string;
  isChain?: boolean;
  slug?: string;
  logo?: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  socialMedia?: SocialMedia;
}

export interface BranchInput {
  name: string;
  address: string;
  country: string;
  locality: string;
  manager: string;
  phoneNumber?: string;
}