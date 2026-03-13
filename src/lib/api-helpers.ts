import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type PrismaWriteErrorMessages = {
  conflict?: string;
  notFound?: string;
  invalidRelation?: string;
  fallback?: string;
};

export function prismaWriteErrorResponse(
  error: unknown,
  messages: PrismaWriteErrorMessages = {},
) {
  const {
    conflict = "Resource already exists",
    notFound = "Resource not found",
    invalidRelation = "Invalid relation reference",
    fallback = "Database write failed",
  } = messages;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: conflict, code: error.code },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: notFound, code: error.code },
        { status: 404 },
      );
    }

    if (error.code === "P2003" || error.code === "P2014") {
      return NextResponse.json(
        { error: invalidRelation, code: error.code },
        { status: 422 },
      );
    }
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}
