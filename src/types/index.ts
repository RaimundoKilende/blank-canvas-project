export type UserRole = "admin" | "technician" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
}

export interface Technician extends User {
  role: "technician";
  specialties: string[];
  verified: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  documents?: string[];
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Client extends User {
  role: "client";
  address?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  active: boolean;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  technicianId?: string;
  categoryId: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  basePrice: number;
  extras: ServiceExtra[];
  totalPrice: number;
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
  cancelledBy?: "client" | "technician";
  createdAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface ServiceExtra {
  id: string;
  name: string;
  price: number;
}

export interface Review {
  id: string;
  serviceRequestId: string;
  clientId: string;
  technicianId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "service_request" | "service_update" | "payment" | "system";
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}
