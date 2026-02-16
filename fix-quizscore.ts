// Script to fix quizscore type mismatch in existing database
// Run this with: npx tsx fix-quizscore.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database fix for quizscore type mismatch...');

    try {
        // Get all teams
        const teams = await prisma.team.findMany();
        console.log(`Found ${teams.length} teams`);

        // MongoDB doesn't have strict schema migrations like SQL databases
        // We need to update the data directly using MongoDB operations

        // Use raw MongoDB operations to fix the type
        const db = prisma.$db;

        const result = await db.collection('Team').updateMany(
            { quizscore: { $type: 'string' } }, // Find documents where quizscore is a string
            [
                {
                    $set: {
                        quizscore: { $toInt: '$quizscore' } // Convert to integer
                    }
                }
            ]
        );

        console.log(`Updated ${result.modifiedCount} teams with string quizscore`);

        // Also fix strikes if needed
        const strikesResult = await db.collection('Team').updateMany(
            { strikes: { $type: 'string' } },
            [
                {
                    $set: {
                        strikes: { $toInt: '$strikes' }
                    }
                }
            ]
        );

        console.log(`Updated ${strikesResult.modifiedCount} teams with string strikes`);

        console.log('✅ Database fix completed successfully!');
    } catch (error) {
        console.error('❌ Error fixing database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
