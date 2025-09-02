export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
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

export interface Specialty {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AvailableSchedule {
  dayOfWeek: number; // 0-6 (domingo a sábado)
  startTime: string; // formato HH:mm
  endTime: string;   // formato HH:mm
  isActive: boolean;
}

export interface Professional {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  photo?: string;
  specialties: Specialty[];
  availableSchedules: AvailableSchedule[];
  businessId: string;
  branchIndex: number;
  userId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  activeSpecialties: Specialty[];
  activeSchedules: AvailableSchedule[];
}

export interface ProfessionalInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  photo?: string;
  specialties?: SpecialtyInput[];
  availableSchedules?: AvailableScheduleInput[];
  userId?: string;
}

export interface SpecialtyInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface AvailableScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}