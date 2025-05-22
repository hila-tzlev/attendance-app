
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Users
  const users = await prisma.user.createMany({
    data: [
      { employeeId: '123456789', name: 'ישראל ישראלי', isManager: true },
      { employeeId: '987654321', name: 'דנה כהן', isManager: false },
      { employeeId: '111222333', name: 'יוסי לוי', isManager: false }
    ],
    skipDuplicates: true
  });

  // Attendances
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    await prisma.attendance.createMany({
      data: [
        {
          userId: user.id,
          clockIn: new Date('2024-01-20T08:00:00Z'),
          clockOut: new Date('2024-01-20T16:00:00Z')
        },
        {
          userId: user.id,
          clockIn: new Date('2024-01-21T08:30:00Z'),
          clockOut: new Date('2024-01-21T17:00:00Z')
        }
      ],
      skipDuplicates: true
    });
  }

  // Manual Updates
  await prisma.manualUpdate.createMany({
    data: [
      {
        userId: allUsers[0].id,
        date: new Date('2024-01-19'),
        hours: '09:00-17:00',
        status: 'APPROVED'
      },
      {
        userId: allUsers[1].id,
        date: new Date('2024-01-18'),
        hours: '08:00-16:00',
        status: 'PENDING'
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
