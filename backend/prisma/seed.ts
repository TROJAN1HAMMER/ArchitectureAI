import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists");
    return;
  }

  const passwordHash = await argon2.hash("Password123!");
  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user created with email", email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
