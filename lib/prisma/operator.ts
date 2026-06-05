// lib/prisma/operators.ts
// Server-only data access functions for operators.
// All database queries for operators go here — never query Prisma directly in components.
import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { Operator, OperatorUser } from "@/types";

// Get operator by Supabase Auth UID
export async function getOperatorBySupabaseId(
  supabaseId: string
): Promise<(OperatorUser & { operator: Operator }) | null> {
  return prisma.operatorUser.findUnique({
    where: { supabaseId },
    include: { operator: true },
  });
}

// Get operator by slug (used for public pages and subdomain routing)
export async function getOperatorBySlug(
  slug: string
): Promise<Operator | null> {
  return prisma.operator.findUnique({
    where: { slug },
  });
}

// Create a new operator and owner user record on signup
export async function createOperatorWithOwner({
  name,
  slug,
  email,
  supabaseId,
}: {
  name: string;
  slug: string;
  email: string;
  supabaseId: string;
}): Promise<Operator> {
  return prisma.operator.create({
    data: {
      name,
      slug,
      email,
      plan: "STARTER",
      isActive: true,
      users: {
        create: {
          supabaseId,
          role: "OWNER",
        },
      },
    },
  });
}

// Get full operator stats for the dashboard
export async function getOperatorWithStats(operatorId: string) {
  return prisma.operator.findUnique({
    where: { id: operatorId },
    include: {
      _count: {
        select: {
          tours: true,
          bookings: true,
          customers: true,
        },
      },
    },
  });
}