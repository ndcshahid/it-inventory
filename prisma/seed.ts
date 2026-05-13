import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@company.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  });
  console.log('Admin user created:', admin.username);

  // Create IT Manager
  const managerPassword = await bcrypt.hash('manager123', 12);
  await prisma.user.upsert({
    where: { username: 'itmanager' },
    update: {},
    create: {
      username: 'itmanager',
      email: 'itmanager@company.com',
      password: managerPassword,
      name: 'IT Manager',
      role: Role.IT_MANAGER,
    },
  });

  // Create Viewer
  const viewerPassword = await bcrypt.hash('viewer123', 12);
  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      username: 'viewer',
      email: 'viewer@company.com',
      password: viewerPassword,
      name: 'Viewer User',
      role: Role.VIEWER,
    },
  });

  // Create Departments
  const departments = [
    { name: 'IT Department', description: 'Information Technology' },
    { name: 'HR Department', description: 'Human Resources' },
    { name: 'Finance Department', description: 'Finance & Accounting' },
    { name: 'Operations', description: 'Operations Department' },
    { name: 'Marketing', description: 'Marketing & Sales' },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  // Create Locations
  const locations = [
    { name: 'Head Office', description: 'Main headquarters' },
    { name: 'Branch Office A', description: 'Branch office location A' },
    { name: 'Branch Office B', description: 'Branch office location B' },
    { name: 'Warehouse', description: 'Storage warehouse' },
    { name: 'Server Room', description: 'Data center / server room' },
  ];
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }

  // Create Categories
  const categories = [
    { name: 'Laptop', description: 'Portable computers' },
    { name: 'Desktop / CPU', description: 'Desktop computers' },
    { name: 'Monitor', description: 'Display monitors' },
    { name: 'Keyboard', description: 'Input keyboards' },
    { name: 'Mouse', description: 'Computer mice' },
    { name: 'Printer', description: 'Printing devices' },
    { name: 'Router', description: 'Network routers' },
    { name: 'Switch', description: 'Network switches' },
    { name: 'Charger / Adapter', description: 'Power chargers and adapters' },
    { name: 'UPS', description: 'Uninterruptible power supplies' },
    { name: 'Other IT Equipment', description: 'Miscellaneous IT equipment' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Get created records for asset creation
  const laptopCategory = await prisma.category.findFirst({ where: { name: 'Laptop' } });
  const monitorCategory = await prisma.category.findFirst({ where: { name: 'Monitor' } });
  const headOffice = await prisma.location.findFirst({ where: { name: 'Head Office' } });
  const itDept = await prisma.department.findFirst({ where: { name: 'IT Department' } });

  // Create sample employees
  const emp1 = await prisma.employee.upsert({
    where: { employeeId: 'EMP001' },
    update: {},
    create: {
      employeeId: 'EMP001',
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1-555-0101',
      designation: 'Software Engineer',
      departmentId: itDept?.id,
      locationId: headOffice?.id,
    },
  });

  await prisma.employee.upsert({
    where: { employeeId: 'EMP002' },
    update: {},
    create: {
      employeeId: 'EMP002',
      name: 'Jane Doe',
      email: 'jane.doe@company.com',
      phone: '+1-555-0102',
      designation: 'HR Manager',
      locationId: headOffice?.id,
    },
  });

  // Create sample assets
  if (laptopCategory && headOffice) {
    await prisma.asset.upsert({
      where: { assetTag: 'TAG-LAP-001' },
      update: {},
      create: {
        assetName: 'Dell Latitude 5540',
        assetTag: 'TAG-LAP-001',
        serialNumber: 'SN-DELL-001',
        brand: 'Dell',
        model: 'Latitude 5540',
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 1200,
        warrantyExpiry: new Date('2026-01-15'),
        supplierName: 'Dell Technologies',
        condition: 'GOOD',
        status: 'AVAILABLE',
        categoryId: laptopCategory.id,
        locationId: headOffice.id,
      },
    });

    await prisma.asset.upsert({
      where: { assetTag: 'TAG-LAP-002' },
      update: {},
      create: {
        assetName: 'HP EliteBook 840',
        assetTag: 'TAG-LAP-002',
        serialNumber: 'SN-HP-001',
        brand: 'HP',
        model: 'EliteBook 840',
        purchaseDate: new Date('2023-03-20'),
        purchasePrice: 1100,
        warrantyExpiry: new Date('2026-03-20'),
        supplierName: 'HP Inc.',
        condition: 'GOOD',
        status: 'AVAILABLE',
        categoryId: laptopCategory.id,
        locationId: headOffice.id,
      },
    });
  }

  if (monitorCategory && headOffice) {
    await prisma.asset.upsert({
      where: { assetTag: 'TAG-MON-001' },
      update: {},
      create: {
        assetName: 'Samsung 27" FHD Monitor',
        assetTag: 'TAG-MON-001',
        serialNumber: 'SN-SAM-001',
        brand: 'Samsung',
        model: 'S27F350',
        purchaseDate: new Date('2023-02-10'),
        purchasePrice: 280,
        warrantyExpiry: new Date('2026-02-10'),
        condition: 'GOOD',
        status: 'AVAILABLE',
        categoryId: monitorCategory.id,
        locationId: headOffice.id,
      },
    });
  }

  // Log seed activity
  await prisma.activityLog.create({
    data: {
      actionType: 'SYSTEM',
      description: 'Database seeded with initial data',
      userId: admin.id,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
