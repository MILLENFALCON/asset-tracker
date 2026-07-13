import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  baseCurrency: z.string().default("CNY"),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) return NextResponse.json({ error: "邮箱已注册" }, { status: 400 });
  const passwordHash = await bcrypt.hash(body.password, 10);
  await prisma.user.create({
    data: { email: body.email, name: body.name, passwordHash, baseCurrency: body.baseCurrency },
  });
  return NextResponse.json({ ok: true });
}
