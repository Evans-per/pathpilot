const { parseISODuration } = require('../services/youtubeService');
const openaiService = require('../services/openaiService');
const youtubeService = require('../services/youtubeService');
const Video = require('../models/Video');

// Stub Mongoose database calls to allow running the test in isolation without a running MongoDB server
Video.findOne = () => Promise.resolve(null);
Video.create = () => Promise.resolve({});

async function runTests() {
  console.log('🧪 Starting PathPilot service verification tests (Standalone Mode)...');

  // Test 1: YouTube ISO Duration Parser
  console.log('\nTesting YouTube ISO 8601 duration parsing:');
  const testDurations = [
    { iso: 'PT15M30S', expected: 930 },
    { iso: 'PT1H2M15S', expected: 3735 },
    { iso: 'PT45M', expected: 2700 }
  ];

  for (const t of testDurations) {
    const parsed = parseISODuration(t.iso);
    console.log(`- ${t.iso} parsed to ${parsed} seconds (expected: ${t.expected})`);
    if (parsed !== t.expected) {
      throw new Error(`Duration parsing test failed for ${t.iso}!`);
    }
  }
  console.log('✅ ISO Duration parser working!');

  // Test 2: AI Roadmap Mock Generator
  console.log('\nTesting AI Roadmap Generator Mock Fallback:');
  const mockOnboarding = {
    interest: 'Web Development',
    level: 'Beginner',
    deadlineValue: 4,
    deadlineUnit: 'weeks',
    dailyHours: 2,
    learningStyle: 'Mixed',
    existingSkills: ['HTML', 'Basic CSS']
  };

  const roadmapResult = await openaiService.generateRoadmap(mockOnboarding);
  console.log('- Summary:', roadmapResult.summary);
  console.log(`- Weeks generated: ${roadmapResult.roadmap.length} weeks`);
  
  if (roadmapResult.roadmap.length !== 4) {
    throw new Error('Roadmap week count check failed!');
  }
  console.log('✅ AI Roadmap generation working!');

  // Test 3: YouTube Recommendation Scoring Heuristic
  console.log('\nTesting YouTube video retrieval and scoring:');
  const videos = await youtubeService.getVideosForTopic('React hooks');
  console.log(`- Recommended videos count: ${videos.length}`);
  console.log('- Top Video title:', videos[0].title);
  console.log('- Top Video Relevance score:', videos[0].score);

  if (videos.length === 0 || videos[0].score === undefined) {
    throw new Error('YouTube recommendation scorer check failed!');
  }
  console.log('✅ YouTube search and relevance scoring working!');

  console.log('\n🎉 ALL PATHPILOT SERVICES HAVE PASSED INTEGRITY CHECKS!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Verification test failed:', err.message);
  process.exit(1);
});
