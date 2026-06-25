import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, Bookmark, BookmarkCheck, Play, Clock, 
  Eye, ExternalLink, Sparkles, Heart, Filter, ChevronRight, Award
} from 'lucide-react';

const VideoPlayer = () => {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'saved'
  
  const [loading, setLoading] = useState(false);
  const [activeEmbedId, setActiveEmbedId] = useState(null); 
  const [activeEmbedTitle, setActiveEmbedTitle] = useState('');
  const [error, setError] = useState('');

  // Filters State
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/videos/saved');
      if (res.data && res.data.success) {
        setSavedVideos(res.data.savedVideos || []);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };

  const handleSearch = async (searchTopic) => {
    const targetQuery = searchTopic || query;
    if (!targetQuery.trim()) return;

    setLoading(true);
    setError('');
    setActiveTab('search');

    try {
      const res = await api.get("/videos", {
        params: { topic: targetQuery }
      });
      if (res.data && res.data.success) {
        setVideos(res.data.videos || []);
      }
    } catch (err) {
      console.error('Error searching videos:', err);
      setError('Could not retrieve YouTube recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Fetch search results
  useEffect(() => {
    const forwardedQuery = location.state?.query;
    if (forwardedQuery) {
      setQuery(forwardedQuery);
      handleSearch(forwardedQuery);
    } else {
      const storedUser = localStorage.getItem('pathpilot_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const interest = parsed.onboardingData?.interest || 'React';
        setQuery(interest + " Tutorial");
        handleSearch(interest + " Tutorial");
      }
    }
  }, [location.state]);

  const handleToggleBookmark = async (video) => {
    const isSaved = savedVideos.some(v => v.videoId === video.videoId);
    try {
      if (isSaved) {
        const res = await api.delete("/videos/save/" + video.videoId);
        if (res.data && res.data.success) {
          setSavedVideos(res.data.savedVideos || []);
        }
      } else {
        const res = await api.post("/videos/save", {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channel: video.channel
        });
        if (res.data && res.data.success) {
          setSavedVideos(res.data.savedVideos || []);
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const isBookmarked = (videoId) => {
    return savedVideos.some(v => v.videoId === videoId);
  };

  // Helper formats
  const formatViews = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(0) + "k";
    return count;
  };

  const formatDuration = (durationISO) => {
    const match = durationISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '00:00';
    const hours = match[1] ? match[1] + ":" : "";
    const minutes = match[2] ? match[2].padStart(2, '0') + ":" : "00:";
    const seconds = match[3] ? match[3].padStart(2, '0') : "00";
    return hours + minutes + seconds;
  };

  const parseISODuration = (durationISO) => {
    if (!durationISO) return 0;
    const match = durationISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  const getDifficulty = (title) => {
    const t = title.toLowerCase();
    if (t.includes('advanced') || t.includes('expert') || t.includes('patterns') || t.includes('architecture') || t.includes('deep dive')) {
      return 'Advanced';
    }
    if (t.includes('beginner') || t.includes('intro') || t.includes('basics') || t.includes('crash course') || t.includes('for absolute')) {
      return 'Beginner';
    }
    return 'Intermediate';
  };

  // Filtering Logic
  const filteredVideos = (activeTab === 'search' ? videos : savedVideos).filter(video => {
    // Topic Filter
    if (selectedTopic && !video.title.toLowerCase().includes(selectedTopic.toLowerCase())) {
      return false;
    }
    
    // Difficulty Filter
    const diff = getDifficulty(video.title);
    if (selectedDifficulty !== 'All' && diff !== selectedDifficulty) {
      return false;
    }
    
    // Duration Filter
    const durationSec = parseISODuration(video.duration);
    if (selectedDuration === 'Short' && durationSec >= 1200) return false; // Short < 20 mins
    if (selectedDuration === 'Medium' && (durationSec < 1200 || durationSec > 3600)) return false; // Medium 20-60 mins
    if (selectedDuration === 'Long' && durationSec <= 3600) return false; // Long > 60 mins
    
    return true;
  });

  // Categorize Lanes (Only on search tab and when no topic/duration filter is selected for clarity)
  const showLanes = activeTab === 'search' && selectedDifficulty === 'All' && selectedDuration === 'All' && !selectedTopic;

  const forYouVideos = filteredVideos.filter(v => v.score >= 70);
  const trendingVideos = filteredVideos.filter(v => v.views >= 500000 && v.score < 70);
  const recommendedVideosList = filteredVideos.filter(v => v.score < 70 && v.views < 500000);

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Header and Toggle tab */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-205 pb-4 dark:border-darkbg-border">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">Lecture Videos</h1>
          <p className="text-xs text-slate-400 mt-1">High-quality, long-form courses curated and scored for your roadmap.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-900 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('search')}
            className={"rounded-lg px-4 py-2 text-xs font-bold transition-all " + (activeTab === 'search' ? "bg-white text-slate-800 shadow-sm dark:bg-darkbg-card dark:text-white" : "text-slate-500 hover:text-slate-805 dark:text-slate-400 dark:hover:text-slate-200")}
          >
            Search Lectures
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={"rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center space-x-1.5 " + (activeTab === 'saved' ? "bg-white text-slate-800 shadow-sm dark:bg-darkbg-card dark:text-white" : "text-slate-500 hover:text-slate-805 dark:text-slate-405 dark:hover:text-slate-200")}
          >
            <Bookmark className="h-3.5 w-3.5 fill-current" />
            <span>Bookmarks ({savedVideos.length})</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR (Only visible on search tab) */}
      {activeTab === 'search' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2.5"
        >
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lectures (e.g. React hooks for beginners...)"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg-card dark:text-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-6 font-bold text-white shadow-md shadow-accent/15 hover:bg-accent-dark transition-colors disabled:opacity-50 text-xs"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      )}

      {/* Layout Grid: 12 Columns */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Collapsible Filter Panel Sidebar (3 Columns) */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="w-full lg:hidden flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 dark:bg-darkbg-card dark:border-slate-800 dark:text-slate-300"
          >
            <span className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-accent" />
              <span>Filters & Categories</span>
            </span>
            <ChevronRight className={"h-4 w-4 transform transition-transform " + (showFiltersMobile ? "rotate-90" : "")} />
          </button>

          {/* Filters List */}
          <div className={"rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-5 lg:block " + (showFiltersMobile ? "block" : "hidden")}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Filters</h3>
              {(selectedDifficulty !== 'All' || selectedDuration !== 'All' || selectedTopic !== '') && (
                <button 
                  onClick={() => {
                    setSelectedDifficulty('All');
                    setSelectedDuration('All');
                    setSelectedTopic('');
                  }}
                  className="text-[10px] font-bold text-accent hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Topic filter keyword */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Topic</label>
              <input
                type="text"
                placeholder="Type keyword (e.g. Hooks)"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Difficulty Level</label>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={"px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all " + (selectedDifficulty === diff ? "bg-accent/10 border-accent text-accent dark:bg-accent/15" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400")}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Video Duration</label>
              <div className="flex flex-col gap-1.5">
                {['All', 'Short', 'Medium', 'Long'].map(dur => (
                  <button
                    key={dur}
                    onClick={() => setSelectedDuration(dur)}
                    className={"w-full text-left px-3 py-2 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-between " + (selectedDuration === dur ? "bg-accent/10 border-accent text-accent dark:bg-accent/15" : "bg-slate-50 border-slate-200 text-slate-550 hover:text-slate-700 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400")}
                  >
                    <span>{dur === 'Short' ? 'Short (<20m)' : dur === 'Medium' ? 'Medium (20-60m)' : dur === 'Long' ? 'Long (>60m)' : 'All Durations'}</span>
                    {selectedDuration === dur && <span className="text-[8px] font-bold">●</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Video Catalog Lanes or Grid (9 Columns) */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] text-slate-400 font-medium animate-pulse">Retrieving lectures...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center text-slate-400 text-xs border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border">
              No matching courses found. Modify filters or search keywords.
            </div>
          ) : showLanes ? (
            <div className="space-y-8">
              {/* Lane 1: For You recommendations */}
              {forYouVideos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">For You Curated Recommendations</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {forYouVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        isSaved={isBookmarked(video.videoId)}
                        onToggleBookmark={handleToggleBookmark}
                        onPlay={() => {
                          setActiveEmbedId(video.videoId);
                          setActiveEmbedTitle(video.title);
                        }}
                        formatViews={formatViews}
                        formatDuration={formatDuration}
                        getDifficulty={getDifficulty}
                        showScore={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Lane 2: Trending Lectures */}
              {trendingVideos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-1.5">
                    <Award className="h-4.5 w-4.5 text-secondary" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Trending Educational Lectures</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {trendingVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        isSaved={isBookmarked(video.videoId)}
                        onToggleBookmark={handleToggleBookmark}
                        onPlay={() => {
                          setActiveEmbedId(video.videoId);
                          setActiveEmbedTitle(video.title);
                        }}
                        formatViews={formatViews}
                        formatDuration={formatDuration}
                        getDifficulty={getDifficulty}
                        showScore={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Lane 3: Recommended Courses */}
              {recommendedVideosList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-4.5 w-4.5 text-success" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recommended Syllabus Courses</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {recommendedVideosList.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        isSaved={isBookmarked(video.videoId)}
                        onToggleBookmark={handleToggleBookmark}
                        onPlay={() => {
                          setActiveEmbedId(video.videoId);
                          setActiveEmbedTitle(video.title);
                        }}
                        formatViews={formatViews}
                        formatDuration={formatDuration}
                        getDifficulty={getDifficulty}
                        showScore={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Plain filtered grid view
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  isSaved={isBookmarked(video.videoId)}
                  onToggleBookmark={handleToggleBookmark}
                  onPlay={() => {
                    setActiveEmbedId(video.videoId);
                    setActiveEmbedTitle(video.title);
                  }}
                  formatViews={formatViews}
                  formatDuration={formatDuration}
                  getDifficulty={getDifficulty}
                  showScore={activeTab === 'search'}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* LIGHTBOX IFRAME VIDEO PLAYER OVERLAY */}
      {activeEmbedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 overflow-hidden shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-3.5 text-white">
              <span className="text-xs font-bold max-w-[80%] truncate">{activeEmbedTitle}</span>
              <button
                onClick={() => {
                  setActiveEmbedId(null);
                  setActiveEmbedTitle('');
                }}
                className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors text-white font-bold text-xs"
              >
                Close Player
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {activeEmbedId.startsWith('mockVideoId') ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Play className="h-16 w-16 text-accent mb-4 animate-pulse" />
                  <h4 className="text-base font-bold text-white">Lecture Simulation Active</h4>
                  <p className="max-w-md text-xs mt-1.5 text-slate-500">
                    This is a seeded sandbox course block. In production, this embeds the YouTube video iframe matching ID: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-accent">{activeEmbedId.split('_')[0]}</code>
                  </p>
                  <button
                    onClick={() => window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(activeEmbedTitle), '_blank')}
                    className="mt-6 flex items-center space-x-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-accent-dark transition-all"
                  >
                    <span>Open search on YouTube</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <iframe
                  title="YouTube video player"
                  src={"https://www.youtube.com/embed/" + activeEmbedId + "?autoplay=1"}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal reusable card template
const VideoCard = ({ video, isSaved, onToggleBookmark, onPlay, formatViews, formatDuration, getDifficulty, showScore }) => {
  const difficulty = getDifficulty(video.title);
  
  // Difficulty Color Map
  const diffColor = difficulty === 'Advanced' 
    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
    : difficulty === 'Beginner' 
    ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : 'bg-amber-500/10 text-amber-500 border-amber-500/20';

  return (
    <div className="group relative rounded-2xl bg-white overflow-hidden border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer" onClick={onPlay}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/30 transition-colors flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-accent group-hover:bg-white shadow-lg scale-90 group-hover:scale-100 transition-all">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </span>
        </div>

        {video.duration && (
          <span className="absolute bottom-2.5 right-2.5 rounded bg-black/75 px-2 py-0.5 text-[9px] font-bold text-white flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(video.duration)}</span>
          </span>
        )}
      </div>

      {/* Info details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2">
          {/* Difficulty Badge & Relevance score */}
          <div className="flex items-center justify-between">
            <span className={"text-[8px] font-extrabold uppercase border px-2 py-0.5 rounded-full " + diffColor}>
              {difficulty}
            </span>
            {showScore && video.score && (
              <span className="flex items-center space-x-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-accent dark:bg-blue-950/20 dark:text-blue-400 border border-blue-105/30">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Relevance {video.score}%</span>
              </span>
            )}
          </div>

          <h3 
            onClick={onPlay}
            className="font-bold text-slate-805 dark:text-slate-200 text-xs leading-snug line-clamp-2 hover:text-accent dark:hover:text-blue-400 cursor-pointer"
          >
            {video.title}
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold">{video.channel}</p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {video.views !== undefined && (
            <span className="flex items-center space-x-1 text-[9px] text-slate-450 font-bold">
              <Eye className="h-3.5 w-3.5" />
              <span>{formatViews(video.views)} views</span>
            </span>
          )}

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(video)}
            className={"rounded-lg p-1.5 transition-colors border " + (isSaved ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30" : "text-slate-400 hover:bg-slate-50 border-slate-100 hover:text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800")}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;