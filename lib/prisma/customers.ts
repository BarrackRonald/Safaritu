// lib/prisma/customers.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { LeadStatus } from "@prisma/client";

export async function getCustomersByOperator(
  operatorId: string,
  filters?: { search?: string; leadStatus?: LeadStatus }
) {
  return prisma.customer.findMany({
    where: {
      operatorId,
      ...(filters?.leadStatus && { leadStatus: filters.leadStatus }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName:  { contains: filters.search, mode: "insensitive" } },
          { email:     { contains: filters.search, mode: "insensitive" } },
          { phone:     { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(customerId: string, operatorId: string) {
  return prisma.customer.findFirst({
    where:   { id: customerId, operatorId },
    include: {
      bookings: {
        include: {
          tour:      { select: { title: true, coverImageUrl: true } },
          departure: { select: { startDate: true, endDate: true } },
          payments:  { where: { status: "PAID" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateCustomer(
  customerId: string,
  operatorId: string,
  data: {
    firstName?:  string;
    lastName?:   string;
    email?:      string;
    phone?:      string;
    country?:    string;
    notes?:      string;
    tags?:       string[];
    leadStatus?: LeadStatus;
  }
) {
  return prisma.customer.update({
    where: { id: customerId, operatorId },
    data:  { ...data, updatedAt: new Date() },
  });
}

export async function getCustomerStats(operatorId: string) {
  const [total, leads, prospects, customers, vip] = await Promise.all([
    prisma.customer.count({ where: { operatorId } }),
    prisma.customer.count({ where: { operatorId, leadStatus: "LEAD"     } }),
    prisma.customer.count({ where: { operatorId, leadStatus: "PROSPECT" } }),
    prisma.customer.count({ where: { operatorId, leadStatus: "CUSTOMER" } }),
    prisma.customer.count({ where: { operatorId, leadStatus: "VIP"      } }),
  ]);
  return { total, leads, prospects, customers, vip };
}