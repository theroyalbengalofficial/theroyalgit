import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronDown } from 'lucide-react';
import { ASSETS } from '../assets/images';

interface VideoHeroSectionProps {
  onScrollToHero?: () => void;
}

export const VideoHeroSection: React.FC<VideoHeroSectionProps> = ({ onScrollToHero }) => {
  // Default video URL using the uploaded FINAL.mp4
  const DEFAULT_VIDEO = '/FINAL.mp4';
  
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    const saved = localStorage.getItem('trb_hero_video');
    // Clear out previous external sample video to ensure FINAL.mp4 plays by default
    if (saved && (saved.includes('ForBiggerBlazes') || saved.includes('commondatastorage'))) {
      localStorage.removeItem('trb_hero_video');
      return DEFAULT_VIDEO;
    }
    return saved || DEFAULT_VIDEO;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [, setIsFullscreen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoError, setVideoError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autoplay handler with fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setVideoError(false);
        })
        .catch((err) => {
          console.warn('Autoplay was prevented or postponed:', err);
          // If browser blocked unmuted autoplay, ensure muted and retry
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setIsPlaying(false));
        });
    }
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleResetDefault = () => {
    setVideoSrc(DEFAULT_VIDEO);
    localStorage.removeItem('trb_hero_video');
    setVideoError(false);
  };

  const handleScrollClick = () => {
    if (onScrollToHero) {
      onScrollToHero();
    } else {
      const hero = document.getElementById('hero-section');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const currentVideoSrc = isMobile && videoSrc === DEFAULT_VIDEO ? '/FINAL-mobile.mp4' : videoSrc;

  return (
    <section 
      id="video-holder-section"
      className="relative w-full bg-black flex flex-col items-center justify-center overflow-hidden border-b border-[#F25C05]/30 pt-16 sm:pt-20 md:pt-24"
    >
      {/* 1920x1080 Container (Mobile Optimized Aspect Ratio) */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[1920px] aspect-[16/10] sm:aspect-[16/9] max-h-[85vh] sm:max-h-[90vh] bg-black group overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
      >
        {/* HTML5 Autoplay Video */}
        <video
          ref={videoRef}
          src={currentVideoSrc}
          poster={ASSETS.heroBg}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover object-center cursor-pointer select-none"
          onClick={togglePlay}
        />

        {/* Error Fallback Banner if video fails to load */}
        {videoError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <p className="text-white text-base font-light tracking-widest uppercase">Video stream failed to load</p>
            <p className="text-neutral-400 text-xs mt-2 max-w-md">The supplied video URL or file could not be decoded. Click below to load the default 1080p sample.</p>
            <button
              onClick={handleResetDefault}
              className="mt-4 px-6 py-2.5 bg-[#F25C05] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#ff6811] transition-all cursor-pointer"
            >
              Restore 1080p Default Video
            </button>
          </div>
        )}

        {/* Video Player Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent p-3 sm:p-4 transition-opacity duration-300">
          {/* Progress / Seek bar */}
          <div 
            onClick={handleSeek}
            className="w-full h-1.5 sm:h-2 bg-white/20 hover:h-2.5 transition-all cursor-pointer relative mb-2.5 sm:mb-3 rounded-full overflow-hidden"
          >
            <div 
              className="h-full bg-[#F25C05] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 text-white hover:text-[#F25C05] transition-colors cursor-pointer"
                title={isPlaying ? 'Pause Video' : 'Play Video'}
                aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Mute / Unmute */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 text-white hover:text-[#F25C05] transition-colors cursor-pointer flex items-center gap-1.5 bg-black/40 sm:bg-transparent px-2.5 py-1 sm:px-0 sm:py-0 border border-white/20 sm:border-0 rounded-sm sm:rounded-none"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 sm:w-5 h-4 sm:h-5 text-neutral-300" /> : <Volume2 className="w-4 sm:w-5 h-4 sm:h-5 text-[#F25C05]" />}
                <span className="text-[10px] tracking-wider uppercase font-mono sm:hidden">
                  {isMuted ? 'Sound Off' : 'Sound On'}
                </span>
              </button>

              <span className="text-[11px] font-mono tracking-widest text-neutral-400 hidden sm:inline-block uppercase">
                {isMuted ? 'Muted (Autoplay)' : 'Audio Active'} • {isMobile ? 'Mobile HD' : '1080p Ultra HD'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 text-white hover:text-[#F25C05] transition-colors cursor-pointer"
                title="Fullscreen"
                aria-label="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Down Arrow / Jump to Hero Banner */}
      <div className="py-4 text-center">
        <button
          type="button"
          onClick={handleScrollClick}
          className="group flex flex-col items-center justify-center gap-1 text-xs tracking-[0.3em] uppercase text-neutral-300 hover:text-[#F25C05] transition-colors cursor-pointer"
        >
          <span>Enter The Hunt</span>
          <ChevronDown className="w-4 h-4 text-[#F25C05] animate-bounce" />
        </button>
      </div>
    </section>
  );
};

export default VideoHeroSection;
