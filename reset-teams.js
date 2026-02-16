// Quick fix for quizscore type mismatch
// This will delete all existing teams and reset the database
// Run with: node reset-teams.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Deleting all teams, members, and answers...');

    // Delete in correct order (children first due to relations)
    await prisma.answer.deleteMany({});
    console.log('✅ Deleted all answers');

    await prisma.member.deleteMany({});
    console.log('✅ Deleted all members');

    await prisma.team.deleteMany({});
    console.log('✅ Deleted all teams');

    console.log('🎉 Database reset complete! You can now register new teams.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
