import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { join } from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/common/prisma.service';
import { SeederData } from './seeder.type';

@Injectable()
export class SeederService {
  constructor(
    private prismaService: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  private ensureNotProduction() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Seeder is disabled in production');
    }
  }

  private loadSeederData(): SeederData {
    const filePath = join(process.cwd(), 'src', 'seeder', 'seeder.json');

    const raw = fs.readFileSync(filePath, 'utf-8');

    return JSON.parse(raw) as SeederData;
  }

  async seed() {
    this.ensureNotProduction();

    const data = this.loadSeederData();
    this.logger.info('Seeder transaction started');

    const seederUsernames: string[] = [];

    try {
      await this.prismaService.$transaction(async (tx) => {
        for (const userData of data.users) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);

          const user = await tx.user.upsert({
            where: { username: userData.username },
            update: {},
            create: {
              username: userData.username,
              password: hashedPassword,
              name: userData.name,
            },
          });

          seederUsernames.push(user.username);

          for (const contactData of userData.contacts ?? []) {
            const contact = await tx.contact.create({
              data: {
                first_name: contactData.first_name,
                last_name: contactData.last_name,
                email: contactData.email,
                phone: contactData.phone,
                username: user.username,
              },
            });

            for (const addressData of contactData.addresses ?? []) {
              await tx.address.create({
                data: {
                  street: addressData.street,
                  city: addressData.city,
                  province: addressData.province,
                  country: addressData.country,
                  postal_code: addressData.postal_code,
                  contact_id: contact.id,
                },
              });
            }
          }
        }
      });

      this.logger.info('Seeder transaction committed');
      return {
        message: 'Seeder completed successfully',
        count: seederUsernames.length,
        usernames: seederUsernames,
      };
    } catch (error) {
      this.logger.error('Seeder transaction rolled back', error);
      throw error;
    }
  }

  async clear() {
    this.ensureNotProduction();

    this.logger.warn('Seeder clear transaction started');

    await this.prismaService.$transaction(async (tx) => {
      // 1️⃣ Delete addresses NOT owned by admin
      await tx.address.deleteMany({
        where: {
          contact: {
            user: {
              username: {
                not: 'admin',
              },
            },
          },
        },
      });

      // 2️⃣ Delete contacts NOT owned by admin
      await tx.contact.deleteMany({
        where: {
          user: {
            username: {
              not: 'admin',
            },
          },
        },
      });

      // 3️⃣ Delete users except admin
      await tx.user.deleteMany({
        where: {
          username: {
            not: 'admin',
          },
        },
      });
    });

    this.logger.warn('Seeder clear transaction committed');

    return { message: 'All data cleared except admin' };
  }
}
