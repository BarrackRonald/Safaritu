// lib/prisma/departures.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { DepartureStatus } from "@prisma/client";

export async function getDeparturesByTour(tourId: string, operatorId: string) {
  // Verify the tour belongs to this operator first
  const tour = await prisma.tour.findFirst({ where: { id: tourId, operatorId } });
  if (!tour) return null;

  return prisma.departure.findMany({
    where: { tourId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { startDate: "asc" },
  });
}

export async function createDeparture(
  tourId:    string,
  operatorId: string,
  data: {
    startDate:     Date;
    endDate:       Date;
    capacity:      number;
    priceOverride?: number;
    notes?:        string;
  }
) {
  const tour = await prisma.tour.findFirst({ where: { id: tourId, operatorId } });
  if (!tour) throw new Error("Safari not found.");

  return prisma.departure.create({
    data: {
      tourId,
      startDate:     data.startDate,
      endDate:       data.endDate,
      capacity:      data.capacity,
      bookedCount:   0,
      status:        "AVAILABLE",
      priceOverride: data.priceOverride ?? null,
      notes:         data.notes ?? null,
    },
  });
}

export async function updateDeparture(
  departureId: string,
  operatorId:  string,
  data: {
    startDate?:     Date;
    endDate?:       Date;
    capacity?:      number;
    priceOverride?: number | null;
    notes?:         string;
    status?:        DepartureStatus;
  }
) {
  // Verify ownership through the tour relation
  const departure = await prisma.departure.findFirst({
    where: { id: departureId, tour: { operatorId } },
  });
  if (!departure) throw new Error("Departure not found.");

  return prisma.departure.update({
    where: { id: departureId },
    data,
  });
}

export async function deleteDeparture(departureId: string, operatorId: string) {
  const departure = await prisma.departure.findFirst({
    where: { id: departureId, tour: { operatorId } },
    include: { _count: { select: { bookings: true } } },
  });
  if (!departure) throw new Error("Departure not found.");
  if (departure._count.bookings > 0) {
    throw new Error("Cannot delete a departure that has bookings.");
  }
  return prisma.departure.delete({ where: { id: departureId } });
}