
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  User,
  Video, 
  VideoOff,
  Mic,
  MicOff,
  Settings as SettingsIcon, 
  LayoutGrid, 
  Circle,
  ChevronRight,
  Plus,
  Link2,
  AlertCircle,
  ArrowLeft,
  Hand
} from 'lucide-react';
import ControlBar from './components/ControlBar';
import TopBar from './components/TopBar';
import ParticipantGrid from './components/ParticipantGrid';
import RightPanel from './components/RightPanel';
import SettingsSheet from './components/SettingsSheet';
import Toast, { ToastType } from './components/Toast';
import ConfirmationDialog from './components/ConfirmationDialog';
import StreamingCaption from './components/StreamingCaption';
import AuthModal from './components/AuthModal';
import { useAuth } from './components/AuthProvider';
import { useGeminiLive } from './hooks/useGeminiLive';
import { useDevices } from './hooks/useDevices';
import { useRealtimeRoom, RealtimeEvent } from './hooks/useRealtimeRoom';
import { useChatMessages } from './hooks/useChatMessages';
import { PeerManager, SignalData } from './lib/webrtc/PeerManager';
import { Participant, CaptionSegment, Role, RoomSettings, Message } from './types';
import { useCaptionTranslator } from './function-tools/useCaptionTranslator';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [view, setView] = useState<'home' | 'lobby' | 'room'>('home');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'captions' | 'people' | 'chat'>('captions');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isVideoMuteDialogOpen, setIsVideoMuteDialogOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // New Settings State
  const [appSettings, setAppSettings] = useState({
    autoHideControls: true,
    audioSourceType: 'mic' as 'mic' | 'youtube' | 'stream',
    audioSourceUrl: ''
  });
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide Logic
  useEffect(() => {
    if (!appSettings.autoHideControls || view !== 'room') {
      setControlsVisible(true);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
      return;
    }

    const resetTimer = () => {
      setControlsVisible(true);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 5000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    // Initial timer start
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [appSettings.autoHideControls, view]);
  
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    title: 'Orbit Strategy Weekly',
    code: 'ORB-X82-K9Q',
    targetLang: 'English',
    sourceLang: 'Auto',
    captionsEnabled: false,
    readAloudEnabled: false
  });

  const { 
    devices, 
    selectedVideo, 
    setSelectedVideo, 
    selectedAudio, 
    setSelectedAudio 
  } = useDevices();

  const [localParticipant, setLocalParticipant] = useState<Participant>({
    id: user?.id || 'local-user',
    name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest',
    role: 'host',
    isLocal: true,
    audioEnabled: true,
    videoEnabled: true,
    handRaised: false
  });

  // Update localParticipant when user changes
  useEffect(() => {
    if (user) {
      setLocalParticipant(prev => ({
        ...prev,
        id: user.id,
        name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Guest'
      }));
    }
  }, [user]);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState('00:00');

  const peerManagerRef = useRef<PeerManager | null>(null);
  const lastCaptionIdRef = useRef<string | null>(null);

  // Meeting ID for persistence (using room code for now)
  const meetingId = view === 'room' ? roomSettings.code : null;

  // Chat messages hook
  const { messages, sendMessage: sendChatMessage, addRealtimeMessage } = useChatMessages({
    meetingId,
    enabled: view === 'room'
  });

  // Realtime room hook for signaling
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'participant_join':
        setParticipants(prev => {
          if (prev.some(p => p.id === event.payload.id)) return prev;
          addToast(`${event.payload.name} joined`);
          return [...prev, {
            id: event.payload.id,
            name: event.payload.name,
            role: event.payload.role as Role,
            isLocal: false,
            audioEnabled: true,
            videoEnabled: true,
            handRaised: false
          }];
        });
        // Create peer connection for new participant
        peerManagerRef.current?.createPeer(event.payload.id, true);
        break;
      case 'participant_leave':
        setParticipants(prev => {
          const leaving = prev.find(p => p.id === event.payload.id);
          if (leaving) addToast(`${leaving.name} left`);
          return prev.filter(p => p.id !== event.payload.id);
        });
        peerManagerRef.current?.removePeer(event.payload.id);
        break;
      case 'signal':
        peerManagerRef.current?.handleSignal(event.payload.from, event.payload.data);
        break;
      case 'chat':
        addRealtimeMessage(event.payload);
        break;
      case 'status_update':
        setParticipants(prev => prev.map(p =>
          p.id === event.payload.id ? { ...p, ...event.payload } : p
        ));
        break;
    }
  }, [addToast, addRealtimeMessage]);

  const { isConnected: isRealtimeConnected, sendSignal, sendChat, updateStatus, announceJoin, announceLeave } = useRealtimeRoom({
    roomCode: meetingId,
    participantId: localParticipant.id,
    participantName: localParticipant.name,
    onEvent: handleRealtimeEvent,
    enabled: view === 'room'
  });

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Handle sending chat message
  const handleSendChatMessage = useCallback((content: string) => {
    // Send via realtime broadcast for instant delivery
    sendChat(content);
    // Also persist to database
    sendChatMessage(content, user?.id || null, localParticipant.name);
  }, [sendChat, sendChatMessage, user?.id, localParticipant.name]);

  // Initialize Services
  useEffect(() => {
    peerManagerRef.current = new PeerManager(
      (to, data) => sendSignal(to, data),
      (pid, stream) => {
        setParticipants(prev => prev.map(p => 
          p.id === pid ? { ...p, stream } : p
        ));
      }
    );

    const handleSignal = (msg: any) => {
      if (msg.to === localParticipant.id && msg.data && msg.data.type) {
        peerManagerRef.current?.handleSignal(msg.from, msg.data);
      }
      if (msg.type === 'room_command') {
        const { command, from, to, payload } = msg;
        if ((to === 'all' || to === localParticipant.id)) {
          if (command === 'request_mute') {
            const shouldMute = payload.mute;
            setLocalParticipant(prev => {
              if (prev.stream) prev.stream.getAudioTracks().forEach(track => track.enabled = !shouldMute);
              return { ...prev, audioEnabled: !shouldMute };
            });
            if (from !== localParticipant.id) addToast(shouldMute ? "Muted by host" : "Unmuted by host");
          } else if (command === 'request_video') {
            const shouldEnable = payload.enabled;
            setLocalParticipant(prev => {
              if (prev.stream) prev.stream.getVideoTracks().forEach(track => track.enabled = shouldEnable);
              return { ...prev, videoEnabled: shouldEnable };
            });
            if (from !== localParticipant.id) addToast(shouldEnable ? "Host requested video" : "Host stopped your video");
          }
        }
      }
      if (msg.type === 'status_update' && msg.from !== localParticipant.id) {
        setParticipants(prev => prev.map(p => 
          p.id === msg.from ? { ...p, ...msg.payload } : p
        ));
      }
    };
    wsService.on('signal', handleSignal);
    return () => {
      peerManagerRef.current?.destroy();
    };
  }, [localParticipant.id, addToast]);

  useEffect(() => {
    wsService.broadcast('signal', { 
      type: 'status_update', from: localParticipant.id, 
      payload: { 
        audioEnabled: localParticipant.audioEnabled,
        videoEnabled: localParticipant.videoEnabled,
        handRaised: localParticipant.handRaised
      } 
    });
  }, [localParticipant.audioEnabled, localParticipant.videoEnabled, localParticipant.handRaised, localParticipant.id]);

  const { isConnected: isCaptionConnected } = useGeminiLive({
    apiKey: API_KEY,
    enabled: roomSettings.captionsEnabled || roomSettings.readAloudEnabled,
    sourceLang: roomSettings.sourceLang,
    targetLang: roomSettings.targetLang,
    onCaption: useCallback((caption: CaptionSegment) => {
      setCaptions(prev => [caption, ...prev.slice(0, 49)]);
    }, [])
  });

  const { isConnected: isReadAloudConnected, enqueueCaption } = useCaptionTranslator({
    apiKey: API_KEY,
    enabled: roomSettings.readAloudEnabled,
    sourceLang: roomSettings.sourceLang,
    targetLang: roomSettings.targetLang
  });

  useEffect(() => {
    if (!roomSettings.readAloudEnabled) return;
    if (!captions.length) return;
    const latest = captions[0];
    if (latest.id === lastCaptionIdRef.current) return;
    lastCaptionIdRef.current = latest.id;
    enqueueCaption(latest.text);
  }, [captions, roomSettings.readAloudEnabled, enqueueCaption]);

  const isInterpreterConnected = isCaptionConnected || isReadAloudConnected;

  useEffect(() => {
    if (view !== 'room') return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(diff / 60).toString().padStart(2, '0');
      const secs = (diff % 60).toString().padStart(2, '0');
      setElapsedTime(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [view, startTime]);

  const updateMedia = useCallback(async () => {
    if (view !== 'room' && view !== 'lobby') return;
    try {
      const constraints: MediaStreamConstraints = {};
      if (localParticipant.audioEnabled) constraints.audio = { deviceId: selectedAudio };
      if (localParticipant.videoEnabled) constraints.video = { deviceId: selectedVideo };
      if (Object.keys(constraints).length > 0) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalParticipant(prev => {
          if (prev.stream) prev.stream.getTracks().forEach(t => t.stop());
          if (peerManagerRef.current) peerManagerRef.current.setLocalStream(stream);
          return { ...prev, stream };
        });
        if (view === 'room') setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream } : p));
      }
    } catch (err) { console.error(err); }
  }, [view, selectedAudio, selectedVideo, localParticipant.audioEnabled, localParticipant.videoEnabled]);

  useEffect(() => { if (view === 'room') updateMedia(); }, [selectedAudio, selectedVideo, view]);

  const handleJoin = async () => {
    try {
      let stream: MediaStream | undefined;
      if (localParticipant.audioEnabled || localParticipant.videoEnabled) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: localParticipant.audioEnabled ? { deviceId: selectedAudio } : false, 
          video: localParticipant.videoEnabled ? { deviceId: selectedVideo } : false 
        });
      }
      const updatedLocal = { ...localParticipant, stream };
      setLocalParticipant(updatedLocal);
      if (stream && peerManagerRef.current) peerManagerRef.current.setLocalStream(stream);
      setParticipants([updatedLocal]);
      setView('room');
      // Announce join to other participants
      setTimeout(() => announceJoin(localParticipant.role), 500);
    } catch (err) { alert('Media error. Check permissions.'); }
  };

  const handleLeave = () => {
    // Announce leave to other participants
    announceLeave();
    localParticipant.stream?.getTracks().forEach(t => t.stop());
    peerManagerRef.current?.destroy();
    setParticipants([]);
    setView('home');
    setIsRightPanelOpen(false);
    setIsLeaveDialogOpen(false);
  };

  const toggleRightPanel = (tab?: 'captions' | 'people' | 'chat') => {
    if (tab) setRightPanelTab(tab);
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true);
    } else if (tab === rightPanelTab || !tab) {
      setIsRightPanelOpen(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden relative">
      <div className="z-[110]">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}/>
        ))}
      </div>

      <ConfirmationDialog isOpen={isLeaveDialogOpen} onClose={() => setIsLeaveDialogOpen(false)} onConfirm={handleLeave} title="Leave Meeting?" message="Are you sure you want to exit?" confirmText="Leave" cancelText="Stay"/>
      <ConfirmationDialog isOpen={isVideoMuteDialogOpen} onClose={() => setIsVideoMuteDialogOpen(false)} onConfirm={() => { setLocalParticipant(p => { if (p.stream) p.stream.getVideoTracks().forEach(t => t.enabled = false); return { ...p, videoEnabled: false }; }); setIsVideoMuteDialogOpen(false); }} title="Stop Video?" message="Others won't be able to see you." confirmText="Stop" cancelText="Keep On"/>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {view === 'home' ? (
        <div className="h-screen w-full orbit-gradient flex items-center justify-center p-6 relative overflow-y-auto">
          <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center z-10 py-12">
            <div className="space-y-8 text-center lg:text-left">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><LayoutGrid className="text-white" size={24} /></div>
                <h1 className="text-3xl font-bold tracking-tighter">Orbit Meet</h1>
              </div>
              <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">Secure meetings <br/><span className="text-blue-500">without borders.</span></h2>
              
              {/* Auth Status */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                {user ? (
                  <span className="text-white/60 text-sm">Signed in as <span className="text-blue-400 font-bold">{user.email}</span></span>
                ) : (
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="text-blue-400 hover:text-blue-300 font-bold text-sm transition-all"
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto lg:mx-0">
                <button onClick={() => setView('lobby')} className="px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 flex-1"><Plus size={20} />New Meeting</button>
                <div className="relative group flex-1"><input type="text" placeholder="Room code" className="w-full h-full min-h-[60px] bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:border-blue-500 transition-all font-bold"/></div>
              </div>
            </div>
            <div className="hidden lg:block glass p-4 rounded-[40px] shadow-2xl opacity-60"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" alt="Professional meeting workspace" className="rounded-[32px] w-full h-[400px] object-cover" /></div>
          </div>
        </div>
      ) : view === 'lobby' ? (
        <div className="h-screen w-full orbit-gradient flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="max-w-2xl w-full glass p-6 md:p-10 rounded-[40px] space-y-8 shadow-2xl my-8">
            <button onClick={() => setView('home')} title="Go back" className="text-white/40 hover:text-white transition-all"><ArrowLeft size={24}/></button>
            <div className="text-center space-y-2"><h2 className="text-3xl md:text-4xl font-black tracking-tight">Prepare your Orbit</h2><p className="text-white/40 font-medium">Verify your settings before entry.</p></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-[4/3] rounded-[32px] bg-zinc-900 border border-white/5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden"><User size={48} className="text-zinc-600" /><div className="absolute bottom-4 flex gap-2"><button onClick={() => setLocalParticipant(p => ({ ...p, audioEnabled: !p.audioEnabled }))} className={`p-4 rounded-2xl transition-all ${localParticipant.audioEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500'}`}>{localParticipant.audioEnabled ? <Mic size={20}/> : <MicOff size={20}/>}</button><button onClick={() => setLocalParticipant(p => ({ ...p, videoEnabled: !p.videoEnabled }))} className={`p-4 rounded-2xl transition-all ${localParticipant.videoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500'}`}>{localParticipant.videoEnabled ? <Video size={20}/> : <VideoOff size={20}/>}</button></div></div>
              <div className="flex flex-col justify-center gap-6"><div className="space-y-2"><label htmlFor="participant-name" className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Name</label><input id="participant-name" type="text" placeholder="Enter your name" value={localParticipant.name} onChange={(e) => setLocalParticipant(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold"/></div><button onClick={handleJoin} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-500/20">Join Orbit</button></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen w-full flex overflow-hidden">
          {/* Main Viewport Container */}
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <div className={`transition-all duration-500 transform ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
              <TopBar roomTitle={roomSettings.title} roomCode={roomSettings.code} isConnected={isInterpreterConnected} elapsedTime={elapsedTime} isRightPanelOpen={isRightPanelOpen} toggleRightPanel={() => toggleRightPanel()} onOpenSettings={() => setIsSettingsOpen(true)}/>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <ParticipantGrid participants={participants} />
              
              <StreamingCaption 
                captions={captions} 
                visible={roomSettings.captionsEnabled} 
              />
            </div>

            <ControlBar 
              visible={controlsVisible}
              micEnabled={localParticipant.audioEnabled} 
              videoEnabled={localParticipant.videoEnabled} 
              captionsEnabled={roomSettings.captionsEnabled} 
              readAloudEnabled={roomSettings.readAloudEnabled} 
              isRightPanelOpen={isRightPanelOpen} 
              isScreenSharing={isScreenSharing} 
              isHandRaised={localParticipant.handRaised || false} 
              audioSourceType={appSettings.audioSourceType}
              onToggleMic={() => setLocalParticipant(p => { if (p.stream) p.stream.getAudioTracks().forEach(t => t.enabled = !p.audioEnabled); return { ...p, audioEnabled: !p.audioEnabled }; })} 
              onToggleVideo={() => localParticipant.videoEnabled ? setIsVideoMuteDialogOpen(true) : setLocalParticipant(p => { if (p.stream) p.stream.getVideoTracks().forEach(t => t.enabled = true); return { ...p, videoEnabled: true }; })} 
              onToggleCaptions={() => setRoomSettings(s => ({ ...s, captionsEnabled: !s.captionsEnabled }))} 
              onToggleReadAloud={() => setRoomSettings(s => ({ ...s, readAloudEnabled: !s.readAloudEnabled }))} 
              onOpenSettings={() => setIsSettingsOpen(true)} 
              onLeave={() => setIsLeaveDialogOpen(true)} 
              onToggleRightPanel={toggleRightPanel} 
              onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)} 
              onToggleRaiseHand={() => setLocalParticipant(p => ({ ...p, handRaised: !p.handRaised }))} 
              onInviteOthers={() => { navigator.clipboard.writeText(roomSettings.code); addToast('Code copied'); }} 
              onSendEmoji={(e) => addToast(`Reacted with ${e}`)}
            />
          </div>

          {/* Sidebar */}
          {isRightPanelOpen && (
            <div className="w-full md:w-96 flex-shrink-0 z-[60] fixed md:relative h-full animate-in slide-in-from-right duration-300">
              <RightPanel 
                onClose={() => setIsRightPanelOpen(false)} 
                activeTab={rightPanelTab} 
                setActiveTab={setRightPanelTab} 
                captions={captions} 
                participants={participants} 
                localParticipant={localParticipant} 
                onRemoveParticipant={(id) => setParticipants(prev => prev.filter(p => p.id !== id))} 
                onMuteAll={(mute) => {
                  // Broadcast mute command to all participants
                  participants.forEach(p => {
                    if (!p.isLocal) updateStatus({ audioEnabled: !mute });
                  });
                }} 
                onToggleParticipantMute={(pid, mute) => {
                  // In a real implementation, this would send a command to that specific participant
                  addToast(`Requested ${mute ? 'unmute' : 'mute'} for participant`);
                }} 
                onToggleParticipantVideo={(pid, enabled) => {
                  addToast(`Requested video ${enabled ? 'off' : 'on'} for participant`);
                }}
                messages={messages}
                onSendMessage={handleSendChatMessage}
              />
            </div>
          )}

          <SettingsSheet 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            devices={devices} 
            selectedVideo={selectedVideo} 
            selectedAudio={selectedAudio} 
            targetLang={roomSettings.targetLang} 
            onSelectVideo={setSelectedVideo} 
            onSelectAudio={setSelectedAudio} 
            onSelectLang={(lang) => setRoomSettings(s => ({ ...s, targetLang: lang }))}
            autoHideEnabled={appSettings.autoHideControls}
            onToggleAutoHide={(enabled) => setAppSettings(prev => ({ ...prev, autoHideControls: enabled }))}
            audioSourceType={appSettings.audioSourceType}
            audioSourceUrl={appSettings.audioSourceUrl}
            onUpdateAudioSource={(type, url) => setAppSettings(prev => ({ ...prev, audioSourceType: type, audioSourceUrl: url }))}
          />
        </div>
      )}
    </div>
  );
};

export default App;
