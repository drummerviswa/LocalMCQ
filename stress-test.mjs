// Enhanced Stress Test for LocalMCQ
// Targets: Registration, Starting Quiz, Answering Questions, and Submitting

const BASE_URL = 'https://local-mcq.vercel.app/api';
const CONCURRENT_USERS = 60; // Adjust as needed
const QUESTIONS_PER_QUIZ = 20;
const TEST_ID = Date.now().toString().slice(-4);

// Set to true to make all teams submit at the exact same time
const SYNC_SUBMISSION = true;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log(`🚀 Starting Enhanced Stress Test for ${CONCURRENT_USERS} concurrent users...`);
    console.log(`📍 Target: ${BASE_URL}`);
    console.log(`📂 Test ID: ${TEST_ID}`);
    console.log(`Mode: ${SYNC_SUBMISSION ? 'CONCURRENT SUBMISSION' : 'STAGGERED SUBMISSION'}\n`);

    const results = [];
    const submissionBarrier = new Promise((resolve) => {
        if (!SYNC_SUBMISSION) resolve();
        else {
            // We'll resolve this later when all teams are ready
            global.startSubmission = resolve;
        }
    });

    let readyToSubmitCount = 0;

    const tasks = Array.from({ length: CONCURRENT_USERS }).map(async (_, i) => {
        const teamname = `StressTest_P_${TEST_ID}_${i}`;
        const startTime = Date.now();
        let teamid = null;

        try {
            // 1. Register
            const regRes = await fetch(`${BASE_URL}/quiz/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamname,
                    participants: [
                        {
                            name: `P1_${i}`,
                            regno: `R1_${TEST_ID}_${i}`,
                            department: "Testing",
                            course: "Stress",
                            branch: "Test",
                            mobileno: `90000${TEST_ID}${i}`.slice(0, 10)
                        },
                        {
                            name: `P2_${i}`,
                            regno: `R2_${TEST_ID}_${i}`,
                            department: "Testing",
                            course: "Stress",
                            branch: "Test",
                            mobileno: `80000${TEST_ID}${i}`.slice(0, 10)
                        }
                    ]
                })
            });

            const regData = await regRes.json();
            if (!regRes.ok) throw new Error(`Registration failed: ${regData.message || regRes.statusText}`);
            teamid = regData.team.id;

            // 2. Start Quiz
            const startRes = await fetch(`${BASE_URL}/quiz/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamid })
            });

            const startData = await startRes.json();
            if (!startRes.ok) throw new Error(`Start Quiz failed: ${startData.message || startRes.statusText}`);

            const questions = startData.questions;

            // 3. Answer Questions (Randomly)
            // We'll answer 10 random questions to simulate partial completion
            const questionsToAnswer = questions.slice(0, 10);
            for (const q of questionsToAnswer) {
                const ansRes = await fetch(`${BASE_URL}/quiz/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teamid,
                        qid: q.id,
                        answer: q.options[Math.floor(Math.random() * q.options.length)]
                    })
                });
                if (!ansRes.ok) console.error(`Failed to answer question ${q.id} for team ${teamname}`);

                // Small random delay between answers if NOT sync submission
                if (!SYNC_SUBMISSION) await sleep(Math.random() * 500);
            }

            // 4. Prepare for Submission
            readyToSubmitCount++;
            if (SYNC_SUBMISSION && readyToSubmitCount === CONCURRENT_USERS) {
                console.log("🏁 All teams ready! Triggering concurrent submission...");
                global.startSubmission();
            } else if (SYNC_SUBMISSION) {
                // Wait for all to be ready
                await submissionBarrier;
            } else {
                // Staggered: Wait random time
                await sleep(Math.random() * 5000);
            }

            // 5. Submit Quiz
            const subStartTime = Date.now();
            const subRes = await fetch(`${BASE_URL}/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamid })
            });
            const subEndTime = Date.now();

            const subData = await subRes.json();
            if (!subRes.ok) throw new Error(`Submission failed: ${subData.message || subRes.statusText}`);

            results.push({
                index: i,
                success: true,
                totalDuration: subEndTime - startTime,
                submitLatency: subEndTime - subStartTime,
                score: subData.score,
                status: 'OK'
            });

        } catch (error) {
            results.push({
                index: i,
                success: false,
                status: error.message
            });
        }
    });

    await Promise.all(tasks);

    console.log('\n📊 --- TEST SUMMARY ---');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed:     ${failed.length}`);

    if (successful.length > 0) {
        const latencies = successful.map(r => r.submitLatency);
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const max = Math.max(...latencies);
        const min = Math.min(...latencies);
        console.log(`⏱ Avg Submission Latency: ${avg.toFixed(2)}ms`);
        console.log(`⏱ Max Submission Latency: ${max}ms`);
        console.log(`⏱ Min Submission Latency: ${min}ms`);

        const scores = successful.map(r => r.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        console.log(`🎯 Average Score:         ${avgScore.toFixed(2)}`);
    }

    if (failed.length > 0) {
        console.log('\n🔴 --- ERRORS ---');
        const errorCounts = {};
        failed.forEach(r => {
            errorCounts[r.status] = (errorCounts[r.status] || 0) + 1;
        });
        Object.entries(errorCounts).forEach(([error, count]) => {
            console.log(`${count}x: ${error}`);
        });
    }

    console.log('------------------------\n');
}

runTest();
