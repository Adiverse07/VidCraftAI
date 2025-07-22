import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Code, Play, AlertCircle, Sparkles, Video, Menu } from 'lucide-react';
import { sendPrompt } from './api';
import BurgerMenu from './components/BurgerMenu';
import VideoEditor from './components/VideoEditor';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);
  const [videoEditorOpen, setVideoEditorOpen] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videos, setVideos] = useState([]);

  const burgerMenuRef = useRef();
  const burgerButtonRef = useRef();

  useEffect(() => {
    console.log('🔧 DEBUG: burgerMenuOpen changed to:', burgerMenuOpen);
  }, [burgerMenuOpen]);

  useEffect(() => {
    console.log('🔧 DEBUG: videoEditorOpen changed to:', videoEditorOpen);
  }, [videoEditorOpen]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    console.log('📤 Submitting prompt:', prompt);
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await sendPrompt(prompt);
      console.log('📥 Received response:', data);
      setResult(data);

      if (data.ui_actions && data.ui_actions.length > 0) {
        console.log('🎯 Found UI actions, executing:', data.ui_actions);
        executeUIActions(data.ui_actions);
      } else {
        console.log('ℹ️ No UI actions to execute');
      }
    } catch (err) {
      console.error('❌ Generation failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const executeUIActions = (actions) => {
    console.log('🚀 Executing UI actions:', actions);

    actions.forEach((action, index) => {
      console.log(`🎬 Executing action ${index + 1}:`, action);

      setTimeout(() => {
        switch (action.type) {
          case 'open_burger_menu':
            console.log('🍔 Opening burger menu:', action.reasoning);
            setBurgerMenuOpen(true);
            setTimeout(() => {
              if (burgerMenuRef.current && burgerMenuRef.current.fetchVideos) {
                console.log('📹 Fetching videos via ref');
                burgerMenuRef.current.fetchVideos();
              }
            }, 200);
            break;

          case 'open_video_editor':
            console.log('🎬 Opening video editor:', action.reasoning);
            setBurgerMenuOpen(true);
            setTimeout(() => {
              if (burgerMenuRef.current && burgerMenuRef.current.fetchVideos) {
                burgerMenuRef.current.fetchVideos();
              }
              setTimeout(() => {
                const hasSuggestedVideos =
                  action.parameters?.suggested_videos &&
                  action.parameters.suggested_videos.length > 0;
                if (hasSuggestedVideos) {
                  setSelectedVideos(action.parameters.suggested_videos);
                }
                setBurgerMenuOpen(false);
                setTimeout(() => {
                  setVideoEditorOpen(true);
                }, 300);
              }, 800);
            }, 200);
            break;

          default:
            console.warn('⚠️ Unknown UI action:', action.type);
        }
      }, index * 100);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const openBurgerMenu = () => {
    console.log('🍔 Manual burger menu open');
    setBurgerMenuOpen(true);
  };

  const closeBurgerMenu = () => {
    console.log('🍔 Closing burger menu');
    setBurgerMenuOpen(false);
  };

  const openVideoEditor = () => {
    console.log('🎬 Manual video editor open');
    if (videos.length === 0 && selectedVideos.length === 0) {
      console.log('📹 No videos available, opening burger menu instead');
      setBurgerMenuOpen(true);
      return;
    }
    setVideoEditorOpen(true);
  };

  const closeVideoEditor = () => {
    console.log('🎬 Closing video editor');
    setVideoEditorOpen(false);
  };

  const handleVideosUpdate = (updatedVideos) => {
    console.log('📹 Videos updated:', updatedVideos);
    setVideos(updatedVideos);
  };

  const handleVideoSelect = (selectedVideoIds) => {
    console.log('✅ Videos selected:', selectedVideoIds);
    setSelectedVideos(selectedVideoIds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <BurgerMenu
        ref={burgerMenuRef}
        isOpen={burgerMenuOpen}
        onClose={closeBurgerMenu}
        onVideoSelect={handleVideoSelect}
        onVideosUpdate={handleVideosUpdate}
        onOpenEditor={openVideoEditor}
      />

      {videoEditorOpen && (
        <VideoEditor
          isOpen={videoEditorOpen}
          onClose={closeVideoEditor}
          selectedVideos={selectedVideos
            .map((id) => videos.find((v) => v.id === id))
            .filter(Boolean)}
          videos={videos}
          onVideosUpdate={handleVideosUpdate}
        />
      )}

      <button
        ref={burgerButtonRef}
        onClick={openBurgerMenu}
        className="fixed top-6 left-6 z-30 p-3 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl transition-all"
      >
        <Menu className="w-6 h-6 text-cyan-400" />
      </button>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              VidCraftAI
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Transform your ideas into stunning mathematical animations
            </p>
            <p className="text-sm text-gray-400">Powered by Manim</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl mb-8">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your animation... (e.g., 'Create a sine wave animation', 'Show my videos', 'Open video editor')"
                    className="w-full h-32 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none"
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-400">
                      Press Enter to submit, Shift+Enter for new line
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isLoading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg hover:shadow-cyan-500/25"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-300 font-medium mb-1">Error</h3>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {result.intelligent_selection && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-purple-300 font-medium mb-2">
                        Intelligent Tool Selection
                      </h3>
                      <div className="text-sm text-purple-200 space-y-1">
                        {result.tools_used && result.tools_used.length > 0 && (
                          <p>
                            <strong>Tools used:</strong> {result.tools_used.join(' → ')}
                          </p>
                        )}
                        {result.tool_selection_log && result.tool_selection_log.length > 0 && (
                          <div>
                            <strong>Execution log:</strong>
                            <ul className="mt-1 ml-4 space-y-1">
                              {result.tool_selection_log.map((log, i) => (
                                <li key={i} className="text-purple-300">
                                  • {log}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.ui_actions && result.ui_actions.length > 0 && (
                          <div>
                            <strong>UI Actions executed:</strong>
                            <ul className="mt-1 ml-4 space-y-1">
                              {result.ui_actions.map((action, i) => (
                                <li key={i} className="text-purple-300">
                                  • {action.type.replace('_', ' ')}: {action.reasoning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.code && (
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    <div className="flex items-center space-x-2">
                      <Code className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-cyan-300 font-medium">Generated Manim Code</h3>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.code)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="text-gray-300">{result.code}</code>
                  </pre>
                </div>
              )}

              {result.video_url && (
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="flex items-center space-x-2 p-4 border-b border-gray-700/50">
                    <Video className="w-5 h-5 text-green-400" />
                    <h3 className="text-green-300 font-medium">Generated Video</h3>
                  </div>
                  <div className="p-4">
                    <video
                      src={`${API_BASE_URL}${result.video_url}`}
                      controls
                      className="w-full rounded-lg bg-black shadow-lg"
                      preload="metadata"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <a
                        href={`${API_BASE_URL}${result.video_url}`}
                        download
                        className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 px-4 py-2 rounded-lg text-green-300 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>Download Video</span>
                      </a>
                      <button
                        onClick={() => setBurgerMenuOpen(true)}
                        className="flex items-center space-x-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 px-4 py-2 rounded-lg text-cyan-300 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span>View All Videos</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 text-center">
            <h3 className="text-gray-300 font-medium mb-4">Try these examples:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Create a sine wave animation',
                'Show a circle transforming into a square',
                'Animate the Pythagorean theorem',
                'Show my video library',
                'Open the video editor',
                'Create a bouncing ball animation',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
