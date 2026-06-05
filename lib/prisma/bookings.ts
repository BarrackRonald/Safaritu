// lib/prisma/bookings.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { BookingStatus, PaymentStatus } from "@prisma/client";

export async function getBookingsByOperator(
  operatorId: string,
  filters?: {
    status?:        BookingStatus;
    paymentStatus?: PaymentStatus;
    search?:        string;
    tourId?:        string;
  }
) {
  return prisma.booking.findMany({
    where: {
      operatorId,
      ...(filters?.status        && { bookingStatus:  filters.status }),
      ...(filters?.paymentStatus && { paymentStatus:  filters.paymentStatus }),
      ...(filters?.tourId        && { tourId:          filters.tourId }),
      ...(filters?.search && {
        OR: [
          { reference:  { contains: filters.search, mode: "insensitive" } },
          { customer:   { email:     { contains: filters.search, mode: "insensitive" } } },
          { customer:   { firstName: { contains: filters.search, mode: "insensitive" } } },
          { customer:   { lastName:  { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      tour:      { select: { id: true, title: true, coverImageUrl: true } },
      departure: { select: { id: true, startDate: true, endDate: true } },
      customer:  { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      payments:  { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBookingById(bookingId: string, operatorId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, operatorId },
    include: {
      tour:      true,
      departure: true,
      customer:  true,
      payments:  { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateBookingStatus(
  bookingId:     string,
  operatorId:    string,
  bookingStatus: BookingStatus
) {
  return prisma.booking.update({
    where: { id: bookingId, operatorId },
    data:  { bookingStatus, updatedAt: new Date() },
  });
}

export async function updateBookingNotes(
  bookingId:     string,
  operatorId:    string,
  internalNotes: string
) {
  return prisma.booking.update({
    where: { id: bookingId, operatorId },
    data:  { internalNotes, updatedAt: new Date() },
  });
}

export async function getBookingStats(operatorId: string) {
  const [total, confirmed, pending, cancelled, completed] = await Promise.all([
    prisma.booking.count({ where: { operatorId } }),
    prisma.booking.count({ where: { operatorId, bookingStatus: "CONFIRMED"  } }),
    prisma.booking.count({ where: { operatorId, bookingStatus: "PENDING"    } }),
    prisma.booking.count({ where: { operatorId, bookingStatus: "CANCELLED"  } }),
    prisma.booking.count({ where: { operatorId, bookingStatus: "COMPLETED"  } }),
  ]);
  return { total, confirmed, pending, cancelled, completed };
}