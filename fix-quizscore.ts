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
        const result = await prisma.$runCommandRaw({
            update: 'Team',
            updates: [
                {
                    q: { quizscore: { $type: 'string' } },
                    u: [{ $set: { quizscore: { $toInt: '$quizscore' } } }],
                    multi: true
                }
            ]
        }) as any;

        console.log(`Updated ${result.nModified || 0} teams with string quizscore`);

        // Also fix strikes if needed
        const strikesResult = await prisma.$runCommandRaw({
            update: 'Team',
            updates: [
                {
                    q: { strikes: { $type: 'string' } },
                    u: [{ $set: { strikes: { $toInt: '$strikes' } } }],
                    multi: true
                }
            ]
        }) as any;

        console.log(`Updated ${strikesResult.nModified || 0} teams with string strikes`);

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
