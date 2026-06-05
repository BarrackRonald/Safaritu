// types/index.ts
// All shared TypeScript types for SafariTu.
// Import from here across the app: import type { TourCard } from "@/types"
//
// NOTE: The Prisma imports below will show errors in VS Code until you run
// "npx prisma generate" after connecting your database. This is expected.

import type {
  Operator,
  Tour,
  ItineraryDay,
  Departure,
  Booking,
  Customer,
  Payment,
  OperatorUser,
  Plan,
  UserRole,
  TourStatus,
  DepartureStatus,
  BookingStatus,
  PaymentStatus,
  PaymentProvider,
  Difficulty,
  LeadStatus,
} from "@prisma/client";

// Re-export all Prisma base types
export type {
  Operator,
  Tour,
  ItineraryDay,
  Departure,
  Booking,
  Customer,
  Payment,
  OperatorUser,
  Plan,
  UserRole,
  TourStatus,
  DepartureStatus,
  BookingStatus,
  PaymentStatus,
  PaymentProvider,
  Difficulty,
  LeadStatus,
};

// ─── COMPOSITE TYPES ──────────────────────────────────────────────────────────
// These are richer versions of the base types that include related data.
// Used in UI components where you need more than just the base model.

export type TourWithDetails = Tour & {
  itineraryDays: ItineraryDay[];
  departures: Departure[];
  _count: { bookings: number };
};

// Lightweight type for tour listing cards — only what the card needs
export type TourCard = Pick<
  Tour,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "coverImageUrl"
  | "pricePerPerson"
  | "currency"
  | "durationDays"
  | "difficulty"
  | "location"
  | "isFeatured"
  | "isTopPick"
  | "topPickScore"
  | "status"
>;

export type BookingWithDetails = Booking & {
  tour: Pick<Tour, "title" | "slug" | "coverImageUrl">;
  departure: Departure;
  customer: Customer;
  payments: Payment[];
};

export type CustomerWithBookings = Customer & {
  bookings: BookingWithDetails[];
  _count: { bookings: number };
};

export type OperatorWithStats = Operator & {
  _count: { tours: number; bookings: number; customers: number };
};

// ─── API RESPONSE TYPES ───────────────────────────────────────────────────────
// Wrap all API responses in these so the frontend always knows what to expect.

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── DASHBOARD TYPES ──────────────────────────────────────────────────────────

export type DashboardStats = {
  totalRevenue: number;
  totalBookings: number;
  totalCustomers: number;
  totalTours: number;
  revenueThisMonth: number;
  bookingsThisMonth: number;
  occupancyRate: number;
};

export type RevenueDataPoint = {
  month: string;
  revenue: number;
  bookings: number;
};
