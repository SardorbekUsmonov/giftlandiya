import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PHONE_REGEX = /^\+998\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR];

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { email, password, name, phone, role = Role.SUPER_ADMIN } = parseArgs();

  if (!email || !password || !name || !phone) {
    console.error(
      'Usage: npx ts-node scripts/create-admin.ts --email=admin@giftlandiya.uz --password=secret123 --name="Admin Name" --phone=+998901234567 [--role=SUPER_ADMIN]',
    );
    process.exit(1);
  }

  if (!EMAIL_REGEX.test(email)) {
    console.error('Invalid email format');
    process.exit(1);
  }

  if (!PHONE_REGEX.test(phone)) {
    console.error('Invalid phone format, expected +998XXXXXXXXX');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as Role)) {
    console.error(`Invalid role, expected one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });

  if (existing) {
    console.error(`A user with this email or phone already exists (id: ${existing.id})`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      phone,
      name,
      passwordHash,
      role: role as Role,
    },
  });

  console.log(`Admin user created: ${admin.email} (id: ${admin.id}, role: ${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
