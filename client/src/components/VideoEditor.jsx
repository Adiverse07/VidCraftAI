import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Scissors,
  Merge,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle,
} from 'lucide-react';
import { trimVideo, mergeVideos } from '../api';

const API_BASE_URL = 'http://localhost:5000';

export default function VideoEditor({ 
  isOpen = false, 
  onClose, 
  selectedVideos = [], 
  videos = [], 
  onVideosUpdate 
}) {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [sequence, setSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [mergedUrl, setMergedUrl] = useState('');
  const [mergedId, setMergedId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const videoRef = useRef(null);

  // Initialize sequence and selected video when component opens
  useEffect(() => {
    if (isOpen) {
      console.log('VideoEditor opened with:', { selectedVideos, videos });
      
      // Initialize sequence with selected videos or all videos
      const initialSequence = selectedVideos.length > 0 ? selectedVideos : videos;
      setSequence(initialSequence);
      
      // Set the first video as current if available
      if (initialSequence.length > 0) {
        setCurrentVideo(initialSequence[0]);
      } else {
        setCurrentVideo(null);
      }
      
      // Reset states
      setCurrentTime(0);
      setDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      setIsPlaying(false);
      setMergedUrl('');
      setMergedId('');
      setSuccessMessage('');
    }
  }, [isOpen, selectedVideos, videos]);

  // Update sequence when videos or selectedVideos change
  useEffect(() => {
    if (isOpen) {
      const newSequence = selectedVideos.length > 0 ? selectedVideos : videos;
      setSequence(newSequence);
      
      // Update current video if it's no longer in the sequence
      if (currentVideo && !newSequence.find(v => v.id === currentVideo.id)) {
        setCurrentVideo(newSequence.length > 0 ? newSequence[0] : null);
      }
    }
  }, [selectedVideos, videos, isOpen, currentVideo]);

  // Set video source when current video changes
  useEffect(() => {
    if (currentVideo && videoRef.current && isOpen) {
      console.log('Loading video:', currentVideo);
      const cacheBustedUrl = `${API_BASE_URL}${currentVideo.url}?t=${Date.now()}`;
      videoRef.current.src = cacheBustedUrl;
      videoRef.current.load();
      setMergedUrl('');
      setMergedId('');
      setSuccessMessage('');
    }
  }, [currentVideo, isOpen]);

  const fmt = t => {
    const m = Math.floor(t/60),
          s = String(Math.floor(t%60)).padStart(2,'0');
    return `${m}:${s}`;
  };

  const onMeta = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      setTrimEnd(d);
      setTrimStart(0);
    }
  };

  const onTime = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(p => !p);
  };

  const moveUp = i => {
    if (i > 0) {
      setSequence(seq => {
        const a = [...seq];
        [a[i-1], a[i]] = [a[i], a[i-1]];
        return a;
      });
    }
  };

  const moveDown = i => {
    if (i < sequence.length - 1) {
      setSequence(seq => {
        const a = [...seq];
        [a[i+1], a[i]] = [a[i], a[i+1]];
        return a;
      });
    }
  };

  const remove = i => {
    const videoToRemove = sequence[i];
    setSequence(seq => seq.filter((_, j) => j !== i));
    
    // If we're removing the currently selected video, select another one
    if (videoToRemove && currentVideo && videoToRemove.id === currentVideo.id) {
      const remainingVideos = sequence.filter((_, j) => j !== i);
      if (remainingVideos.length > 0) {
        setCurrentVideo(remainingVideos[0]);
      } else {
        setCurrentVideo(null);
      }
    }
  };

  const doTrim = async () => {
    if (!currentVideo || trimStart >= trimEnd) return;
    setProcessing(true);
    setSuccessMessage('');
    
    try {
      const result = await trimVideo(currentVideo.id, trimStart, trimEnd);
      
      // Show success message
      setSuccessMessage('Video trimmed successfully! The original video has been replaced.');
      
      // Since we're replacing the original video, the ID stays the same
      // but we need to reload the video player
      const updatedVideo = {
        ...currentVideo,
        url: result.video_url
      };
      
      setCurrentVideo(updatedVideo);
      
      // Update sequence with the same video object (ID unchanged)
      setSequence(prevSeq => 
        prevSeq.map(v => v.id === currentVideo.id ? updatedVideo : v)
      );

      // Reset player state
      setCurrentTime(0);
      setDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      setIsPlaying(false);
      
      // Force video reload
      if (videoRef.current) {
        const cacheBustedUrl = `${API_BASE_URL}${result.video_url}?t=${Date.now()}`;
        videoRef.current.src = cacheBustedUrl;
        videoRef.current.load();
      }
      
      // Update the parent component's video list
      if (onVideosUpdate) {
        await onVideosUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Trim failed:', error);
      alert(`Trim failed: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const doMerge = async () => {
    if (sequence.length < 2) return;
    setProcessing(true);
    setSuccessMessage('');
    
    try {
      const result = await mergeVideos(sequence.map(v => v.id));
      setMergedUrl(result.video_url);
      setMergedId(result.merged_id || '');
      setSuccessMessage('Videos merged successfully! Click the download button to save the merged video.');
      
      // Update the parent component's video list to include the new merged video
      if (onVideosUpdate) {
        await onVideosUpdate();
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Merge failed:', error);
      alert(`Merge failed: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const downloadMergedVideo = () => {
    if (mergedUrl) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${mergedUrl}`;
      link.download = `merged_video_${mergedId || Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    console.log('VideoEditor closing');
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (onClose) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Show message if no videos available
  if (!currentVideo && sequence.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">No Videos Available</h2>
            <p className="text-gray-400 mb-6">Please select at least one video to edit or create some videos first.</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl w-full max-w-6xl h-full max-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-cyan-300">
            Video Editor {sequence.length > 0 && `(${sequence.length} videos)`}
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close Editor"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-300 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Video Player and Controls */}
          <div className="flex-1 p-6 flex flex-col overflow-auto">
            {currentVideo && (
              <>
                {/* Video Player */}
                <div className="bg-black rounded-xl mb-4 relative aspect-video">
                  <video
                    ref={videoRef}
                    onLoadedMetadata={onMeta}
                    onTimeUpdate={onTime}
                    onPlay={()=>setIsPlaying(true)}
                    onPause={()=>setIsPlaying(false)}
                    className="w-full h-full rounded-xl"
                    controls={false}
                  />
                </div>

                {/* Video Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-colors"
                    >
                      {isPlaying
                        ? <Pause className="w-6 h-6 text-white"/>
                        : <Play className="w-6 h-6 text-white"/>}
                    </button>
                    <div className="text-gray-300">
                      <span className="font-medium">{currentVideo.name || `Video ${currentVideo.id.slice(0, 8)}`}</span>
                      <div className="text-sm text-gray-400">{fmt(currentTime)} / {fmt(duration)}</div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div
                    className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
                    onClick={e => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX-r.left)/r.width;
                      const newTime = pct * duration;
                      seekTo(newTime);
                    }}
                  >
                    <div
                      className="absolute h-full bg-cyan-500 rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime/duration)*100 : 0}%` }}
                    />
                  </div>

                  {/* Trim Controls */}
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-purple-300 font-semibold mb-3">Trim Video (Replaces Original)</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-gray-300 text-sm">Start Time</label>
                        <input
                          type="range"
                          min="0" 
                          max={duration || 0} 
                          step="0.1"
                          value={trimStart}
                          onChange={e=>setTrimStart(+e.target.value)}
                          className="w-full accent-purple-500"
                        />
                        <div className="text-gray-400 text-xs">{fmt(trimStart)}</div>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">End Time</label>
                        <input
                          type="range"
                          min={trimStart} 
                          max={duration || 0} 
                          step="0.1"
                          value={trimEnd}
                          onChange={e=>setTrimEnd(+e.target.value)}
                          className="w-full accent-purple-500"
                        />
                        <div className="text-gray-400 text-xs">{fmt(trimEnd)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <button
                        onClick={() => seekTo(trimStart)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
                      >
                        Go to Start
                      </button>
                      <button
                        onClick={() => seekTo(trimEnd)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
                      >
                        Go to End
                      </button>
                    </div>
                    <button
                      onClick={doTrim}
                      disabled={processing||trimStart>=trimEnd||duration<=0}
                      className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                      <Scissors className="w-4 h-4 mr-2"/> 
                      {processing ? 'Trimming...' : 'Trim & Replace Original'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right panel - Video Sequence */}
          <div className="w-80 border-l border-gray-700 p-6 flex flex-col">
            {/* Merge Controls */}
            <button
              onClick={doMerge}
              disabled={processing||sequence.length<2}
              className="mb-4 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              <Merge className="w-4 h-4 mr-2"/> 
              {processing ? 'Merging...' : `Merge All ${sequence.length} Videos`}
            </button>

            {/* Download Merged Video */}
            {mergedUrl && (
              <button
                onClick={downloadMergedVideo}
                className="mb-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white flex items-center justify-center transition-colors font-semibold"
              >
                <Download className="w-4 h-4 mr-2"/> Download Merged Video
              </button>
            )}

            {/* Video Sequence List */}
            <h4 className="text-gray-300 font-semibold mb-3">Video Sequence ({sequence.length})</h4>
            <div className="overflow-auto flex-1 space-y-3">
              {sequence.map((v, i) => (
                <div
                  key={v.id}
                  onClick={()=>setCurrentVideo(v)}
                  className={`
                    p-3 rounded-xl border cursor-pointer flex flex-col transition-colors
                    ${currentVideo && currentVideo.id===v.id
                      ? 'bg-cyan-500/10 border-cyan-400/50'
                      : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-sm font-medium">
                      {i+1}. {v.name || v.id.slice(0,8)}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={e=>{e.stopPropagation(); moveUp(i);}} 
                        disabled={i===0}
                        className="disabled:opacity-50 p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3 text-gray-400 hover:text-white"/>
                      </button>
                      <button 
                        onClick={e=>{e.stopPropagation(); moveDown(i);}} 
                        disabled={i===sequence.length-1}
                        className="disabled:opacity-50 p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3 text-gray-400 hover:text-white"/>
                      </button>
                      <button 
                        onClick={e=>{e.stopPropagation(); remove(i);}}
                        className="p-1 hover:bg-red-900/20 rounded transition-colors"
                        title="Remove from Sequence"
                      >
                        <X className="w-3 h-3 text-red-400 hover:text-red-300"/>
                      </button>
                    </div>
                  </div>
                  <video
                    src={`${API_BASE_URL}${v.url}?t=${Date.now()}`}
                    className="w-full h-16 object-cover rounded bg-black border border-gray-600"
                    muted
                    playsInline
                  />
                  {currentVideo && currentVideo.id === v.id && (
                    <div className="mt-2 px-2 py-1 bg-cyan-500/20 rounded text-xs text-cyan-300 text-center">
                      Currently Editing
                    </div>
                  )}
                </div>
              ))}
              
              {sequence.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No videos in sequence</p>
                  <p className="text-sm mt-1">Select videos from the library first</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}