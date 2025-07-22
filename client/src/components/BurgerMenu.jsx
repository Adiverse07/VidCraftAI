import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Menu, X, Film, Trash2, Edit, Download, Loader } from 'lucide-react';
import { getVideos, deleteVideo, deleteAllVideos } from '../api';

const API_BASE_URL = 'http://localhost:5000';

const BurgerMenu = forwardRef((props, ref) => {
  const { 
    isOpen: controlledIsOpen = false, 
    onClose: controlledOnClose,
    onVideoSelect = () => {},
    onVideosUpdate = () => {},
    onOpenEditor = () => {}
  } = props;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    fetchVideos,
    openMenu: () => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(true);
      }
      fetchVideos();
    },
    closeMenu: () => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(false);
      }
    }
  }));

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const videoList = await getVideos();
      setVideos(videoList);
      onVideosUpdate(videoList);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVideos();
    }
  }, [isOpen]);

  const handleSelectVideo = (id) => {
    const newSelection = selectedVideos.includes(id) 
      ? selectedVideos.filter(x => x !== id) 
      : [...selectedVideos, id];
    
    setSelectedVideos(newSelection);
    onVideoSelect(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (!selectedVideos.length) return;
    setLoading(true);
    try {
      await Promise.all(selectedVideos.map(deleteVideo));
      setSelectedVideos([]);
      onVideoSelect([]);
      await fetchVideos();
    } catch (err) {
      console.error('Failed to delete selected videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      await deleteAllVideos();
      setVideos([]);
      setSelectedVideos([]);
      onVideoSelect([]);
      onVideosUpdate([]);
    } catch (err) {
      console.error('Failed to delete all videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = () => {
    // Only open editor if videos are selected, otherwise just show a message
    if (selectedVideos.length > 0) {
      onOpenEditor();
    } else if (videos.length > 0) {
      // If no videos selected but videos exist, show a helpful message
      alert('Please select at least one video to edit by clicking on it.');
    } else {
      // No videos at all
      alert('No videos available to edit. Create some animations first!');
    }
  };

  const closeMenu = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <>
      {/* Menu Toggle Button - only show if not controlled externally */}
      {controlledIsOpen === undefined && (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="fixed top-6 left-6 z-40 p-3 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl transition-all"
        >
          <Menu className="w-6 h-6 text-cyan-400" />
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-96 bg-gray-900/95 backdrop-blur-md border-r border-cyan-500/30 z-50
          transform transition-transform duration-300 overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-cyan-300">
              <Film className="w-5 h-5" /> Video Library ({videos.length})
            </h2>
            <button onClick={closeMenu}>
              <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={handleDeleteSelected}
              disabled={!selectedVideos.length || loading}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedVideos.length})
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={!videos.length || loading}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete All
            </button>
            <button
              onClick={openEditor}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 disabled:opacity-50 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit Videos
              {selectedVideos.length > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedVideos.length}
                </span>
              )}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <div className="text-center py-8">
              <Film className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No videos generated yet</p>
              <p className="text-gray-500 text-sm mt-1">Create your first animation!</p>
            </div>
          )}

          {/* Video List */}
          {!loading && videos.length > 0 && (
            <div className="space-y-4">
              {videos.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVideo(v.id)}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${selectedVideos.includes(v.id)
                      ? 'bg-cyan-500/10 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-800/70'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium truncate flex-1 mr-3">
                      {v.name || `Video ${v.id.slice(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-2">
                      {selectedVideos.includes(v.id) && (
                        <span className="text-xs bg-cyan-500 text-white px-2 py-1 rounded-full">
                          Selected
                        </span>
                      )}
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(v.id)}
                        readOnly
                        className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3">
                    Created: {new Date(v.created_at).toLocaleDateString()} at{' '}
                    {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  <video
                    src={`${API_BASE_URL}${v.url}`}
                    className="w-full h-24 rounded-lg bg-black border border-gray-700 object-cover"
                    muted
                    preload="metadata"
                  />
                  
                  <div className="mt-3 flex justify-between items-center">
                    <a
                      href={`${API_BASE_URL}${v.url}`}
                      download
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                    
                    <span className="text-xs text-gray-500">
                      {v.duration ? `${Math.round(v.duration)}s` : 'Unknown duration'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

BurgerMenu.displayName = 'BurgerMenu';

export default BurgerMenu;