import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee, EmployeeRole } from '../employees/entities/employee.entity';

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Employee],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected.');

  const employeeRepo = dataSource.getRepository(Employee);
  const saltRounds = 10;

  const seeds = [
    {
      name: 'Admin',
      email: 'admin@company.com',
      password: await bcrypt.hash('admin123', saltRounds),
      position: 'System Administrator',
      role: EmployeeRole.ADMIN,
    },
    {
      name: 'John Doe',
      email: 'john@company.com',
      password: await bcrypt.hash('employee123', saltRounds),
      position: 'Software Engineer',
      role: EmployeeRole.EMPLOYEE,
    },
    {
      name: 'Jane Doe',
      email: 'jane@company.com',
      password: await bcrypt.hash('employee123', saltRounds),
      position: 'Product Manager',
      role: EmployeeRole.EMPLOYEE,
    },
  ];

  for (const data of seeds) {
    const existing = await employeeRepo.findOne({
      where: { email: data.email },
    });
    if (existing) {
      console.log(`Skipping ${data.email} — already exists.`);
      continue;
    }
    const employee = employeeRepo.create(data);
    await employeeRepo.save(employee);
    console.log(`Created ${data.role}: ${data.email}`);
  }

  await dataSource.destroy();
  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
