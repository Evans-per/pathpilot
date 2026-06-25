const axios = require('axios');
const Video = require('../models/Video');

// Heuristic: list of popular high-quality educational channels to boost channel_quality
const PREMIUM_CHANNELS = [
  'freecodecamp.org',
  'programming with mosh',
  'traversy media',
  'academind',
  'the net ninja',
  'web dev simplified',
  'fireship',
  'javascript mastery',
  'clever programmer',
  'derek banas',
  'edureka!',
  'simplilearn',
  'sentdex',
  'corey schafer',
  'tech with tim',
  'harkirat singh',
  'striver',
  'love babbar',
  'codewithharry'
];

/**
 * Fetch and rank videos for a topic
 */
exports.getVideosForTopic = async (topic, level = 'Beginner', interest = '') => {
  const normalizedTopic = topic.trim().toLowerCase();

  // 1. Check database cache
  try {
    const cached = await Video.findOne({ topic: normalizedTopic });
    if (cached) {
      console.log(`Returning cached YouTube results for topic: ${topic}`);
      return cached.videos;
    }
  } catch (err) {
    console.error('Error querying cached videos:', err.message);
  }

  // 2. Fetch from YouTube API or Fallback
  let videos = [];
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey && apiKey !== 'YOUR_YOUTUBE_API_KEY_HERE') {
    try {
      videos = await fetchFromYouTubeApi(topic, apiKey, level, interest);
    } catch (error) {
      console.error('YouTube API search failed, falling back to mock details:', error.message);
      videos = generateMockVideos(topic);
    }
  } else {
    videos = generateMockVideos(topic);
  }

  // 3. Cache the results
  if (videos.length > 0) {
    try {
      await Video.create({
        topic: normalizedTopic,
        videos: videos
      });
    } catch (err) {
      console.error('Error caching videos to MongoDB:', err.message);
    }
  }

  return videos;
};

/**
 * Call the YouTube Data API v3
 */
async function fetchFromYouTubeApi(topic, apiKey, level = 'Beginner', interest = '') {
  // Generate optimized search query using OpenAI
  const openaiService = require('./openaiService');
  const searchQuery = await openaiService.generateSearchQuery(topic, level, interest);
  console.log(`OpenAI optimized search query for YouTube: "${searchQuery}"`);
  
  // Step A: Search for videos
  const searchUrl = `https://www.googleapis.com/youtube/v3/search`;
  const searchRes = await axios.get(searchUrl, {
    params: {
      part: 'snippet',
      q: searchQuery,
      maxResults: 15,
      type: 'video',
      relevanceLanguage: 'en',
      videoCategoryId: '27', // Education category
      key: apiKey
    },
    timeout: 5000
  });

  const searchItems = searchRes.data.items || [];
  if (searchItems.length === 0) return [];

  const videoIds = searchItems.map(item => item.id.videoId).join(',');

  // Step B: Get statistics & durations
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos`;
  const detailsRes = await axios.get(detailsUrl, {
    params: {
      part: 'statistics,contentDetails,snippet',
      id: videoIds,
      key: apiKey
    },
    timeout: 5000
  });

  const detailItems = detailsRes.data.items || [];
  const parsedVideos = [];

  for (const item of detailItems) {
    const durationISO = item.contentDetails.duration; // e.g. PT1H23M4S or PT15M
    const seconds = parseISODuration(durationISO);

    // Filter: Duration > 15 minutes (900 seconds)
    if (seconds < 900) continue;

    const views = parseInt(item.statistics.viewCount || 0, 10);
    const likes = parseInt(item.statistics.likeCount || 0, 10);
    const publishDate = item.snippet.publishedAt;
    const channelTitle = item.snippet.channelTitle;

    // Calculate score
    const score = calculateVideoScore(views, likes, publishDate, channelTitle);

    parsedVideos.push({
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
      videoId: item.id,
      channel: channelTitle,
      views: views,
      likes: likes,
      duration: durationISO,
      publishDate: publishDate.split('T')[0],
      score: score
    });
  }

  // Sort by score descending
  return parsedVideos.sort((a, b) => b.score - a.score);
}

/**
 * Score formula: views*0.40 + likes*0.30 + recentness*0.20 + channel_quality*0.10
 */
function calculateVideoScore(views, likes, publishDateStr, channelTitle) {
  // Normalize views (logarithmic scaling or proportional cap)
  // Max cap at 5M views for normalization
  const normalizedViews = Math.min(views / 5000000, 1.0);

  // Normalize likes
  // Max cap at 100k likes for normalization
  const normalizedLikes = Math.min(likes / 100000, 1.0);

  // Calculate recentness
  const publishDate = new Date(publishDateStr);
  const diffTimeMs = Math.abs(new Date() - publishDate);
  const diffDays = Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24));
  const diffYears = diffDays / 365;
  const recentness = 1 / (1 + diffYears); // Closer to 1.0 for new videos, closer to 0 for very old

  // Calculate channel quality
  const channelLower = channelTitle.toLowerCase();
  const isPremiumChannel = PREMIUM_CHANNELS.some(name => channelLower.includes(name));
  const channelQuality = isPremiumChannel ? 1.0 : 0.5;

  const score = (normalizedViews * 0.40) + 
                (normalizedLikes * 0.30) + 
                (recentness * 0.20) + 
                (channelQuality * 0.10);

  return parseFloat((score * 100).toFixed(2)); // Return score out of 100
}

/**
 * Helper to parse ISO 8601 Durations (e.g. PT1H23M45S) into total seconds
 */
function parseISODuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * Mock generator for YouTube API fallbacks
 */
function generateMockVideos(topic) {
  const cleanTopic = topic.replace(/beginner|tutorial|course|mastery|advanced/gi, '').trim();
  
  // Seed files for various topics
  return [
    {
      title: `${cleanTopic} Course for Beginners [10 Hours Complete Masterclass]`,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60',
      videoId: 'mockVideoId1_' + encodeURIComponent(cleanTopic).substring(0, 10),
      channel: 'freeCodeCamp.org',
      views: 1250000,
      likes: 45000,
      duration: 'PT10H15M23S',
      publishDate: '2025-01-15',
      score: 82.40
    },
    {
      title: `Learn ${cleanTopic} in 60 Minutes - Full Core Guide`,
      thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600&auto=format&fit=crop&q=60',
      videoId: 'mockVideoId2_' + encodeURIComponent(cleanTopic).substring(0, 10),
      channel: 'Programming with Mosh',
      views: 890000,
      likes: 31000,
      duration: 'PT1H02M00S',
      publishDate: '2025-06-10',
      score: 79.10
    },
    {
      title: `${cleanTopic} Crash Course - Everything You Need to Know`,
      thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=60',
      videoId: 'mockVideoId3_' + encodeURIComponent(cleanTopic).substring(0, 10),
      channel: 'Traversy Media',
      views: 650000,
      likes: 24000,
      duration: 'PT45M12S',
      publishDate: '2024-11-20',
      score: 68.20
    },
    {
      title: `Advanced ${cleanTopic} Patterns and Project Best Practices`,
      thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=60',
      videoId: 'mockVideoId4_' + encodeURIComponent(cleanTopic).substring(0, 10),
      channel: 'Web Dev Simplified',
      views: 320000,
      likes: 18000,
      duration: 'PT25M10S',
      publishDate: '2025-03-01',
      score: 61.50
    },
    {
      title: `How I Mastered ${cleanTopic} - Tips & Study Roadmap`,
      thumbnail: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&auto=format&fit=crop&q=60',
      videoId: 'mockVideoId5_' + encodeURIComponent(cleanTopic).substring(0, 10),
      channel: 'Fireship',
      views: 450000,
      likes: 28000,
      duration: 'PT18M45S',
      publishDate: '2025-04-12',
      score: 59.80
    }
  ];
}
exports.parseISODuration = parseISODuration; // exported for testing/utility if needed
