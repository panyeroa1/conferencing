import React from 'react';
import { 
  Mic, MicOff, Video, VideoOff, 
  PhoneOff, Languages, Subtitles, Settings,
  ScreenShare, Hand, MessageSquare, Users, 
  LayoutGrid, UserPlus, Smile
} from 'lucide-react';

interface ControlBarProps {
  visible?: boolean;
  micEnabled: boolean;
  videoEnabled: boolean;
  captionsEnabled: boolean;
  readAloudEnabled: boolean;
  isRightPanelOpen: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioSourceType?: 'mic' | 'youtube' | 'stream';
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleCaptions: () => void;
  onToggleReadAloud: () => void;
  onOpenSettings: () => void;
  onLeave: () => void;
  onToggleRightPanel: (tab?: 'captions' | 'people' | 'chat') => void;
  onToggleScreenShare: () => void;
  onToggleRaiseHand: () => void;
  onInviteOthers: () => void;
  onSendEmoji: (emoji: string) => void;
}

const AudioVisualizer = () => (
  <div className="flex items-end gap-[1px] h-3 ml-2">
    <div className="w-[2px] bg-blue-400 animate-[visualize_0.6s_ease-in-out_infinite] h-[40%]"></div>
    <div className="w-[2px] bg-blue-400 animate-[visualize_0.8s_ease-in-out_infinite] h-full"></div>
    <div className="w-[2px] bg-blue-400 animate-[visualize_0.7s_ease-in-out_infinite] h-[60%]"></div>
  </div>
);

const ControlBar: React.FC<ControlBarProps> = ({
  visible = true,
  micEnabled,
  videoEnabled,
  captionsEnabled,
  readAloudEnabled,
  isRightPanelOpen,
  isScreenSharing,
  isHandRaised,
  audioSourceType = 'mic',
  onToggleMic,
  onToggleVideo,
  onToggleCaptions,
  onToggleReadAloud,
  onOpenSettings,
  onLeave,
  onToggleRightPanel,
  onToggleScreenShare,
  onToggleRaiseHand,
  onInviteOthers,
  onSendEmoji
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const emojis = ['👋', '🔥', '❤️', '👏', '😂', '😮', '😢', '👍'];

  return (
    <div className={`h-24 flex items-center px-4 md:px-8 z-50 pb-6 transition-all duration-500 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
      <div className="w-full flex items-center justify-between max-w-[1600px] mx-auto">
        
        {/* Most Left: Mic and Video */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 min-w-[140px]">
          <button 
            onClick={onToggleMic}
            className={`flex items-center justify-center h-14 px-5 rounded-2xl transition-all border hover:scale-105 ${micEnabled ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'}`}
          >
            {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            {micEnabled && <AudioVisualizer />}
          </button>
          <button 
            onClick={onToggleVideo}
            className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all border hover:scale-105 ${videoEnabled ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'}`}
          >
            {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        </div>

        {/* Middle: Centered Utility Icons - Unified Size */}
        <div className="flex-1 flex justify-center overflow-hidden px-4">
          <div className="glass px-2.5 py-2.5 rounded-2xl flex items-center gap-1.5 md:gap-2.5 border border-white/10 overflow-x-auto no-scrollbar max-w-full relative shadow-2xl">
            <button 
              onClick={onToggleScreenShare}
              className={`p-3.5 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Share Screen"
            >
              <ScreenShare size={20} />
            </button>
            <button 
              onClick={onToggleRaiseHand}
              className={`p-3.5 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${isHandRaised ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Raise Hand"
            >
              <Hand size={20} />
            </button>
            
            <div className="w-[1px] h-8 bg-white/10 mx-1 flex-shrink-0" />

            <button 
              onClick={onToggleCaptions}
              className={`p-3.5 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${captionsEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Captions"
            >
              <Subtitles size={20} />
            </button>
            <button 
              onClick={onToggleReadAloud}
              className={`p-3.5 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${readAloudEnabled ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Translation"
            >
              <Languages size={20} />
            </button>

            {/* Source Display Indicator */}
             <button 
              onClick={onOpenSettings}
              className={`p-3.5 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${audioSourceType !== 'mic' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title={`Source: ${audioSourceType}`}
            >
              {audioSourceType === 'youtube' ? (
                <div className="relative">
                  <Video size={20} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black"></div>
                </div>
              ) : audioSourceType === 'stream' ? (
                <div className="relative">
                  <LayoutGrid size={20} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                </div>
              ) : (
                <Settings size={20} />
              )}
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-1 flex-shrink-0" />

            <button 
              onClick={() => onToggleRightPanel('chat')}
              className="p-3.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all flex-shrink-0 hover:scale-110"
              title="Chat"
            >
              <MessageSquare size={20} />
            </button>
            <button 
              onClick={() => onToggleRightPanel('people')}
              className={`p-3.5 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${isRightPanelOpen ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="People"
            >
              <Users size={20} />
            </button>
            
            <div className="w-[1px] h-8 bg-white/10 mx-1 flex-shrink-0" />

            <button 
              onClick={onInviteOthers}
              className="p-3.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all flex-shrink-0 hover:scale-110"
              title="Invite"
            >
              <UserPlus size={20} />
            </button>
            
            <div className="relative flex-shrink-0">
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-3.5 rounded-xl transition-all hover:scale-110 ${showEmojiPicker ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                title="Emoji"
              >
                <Smile size={20} />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 glass p-2 rounded-2xl flex gap-1 shadow-2xl animate-orbit-in z-[60]">
                  {emojis.map(e => (
                    <button 
                      key={e} 
                      onClick={() => { onSendEmoji(e); setShowEmojiPicker(false); }}
                      className="p-2.5 hover:bg-white/10 rounded-xl text-2xl transition-all hover:scale-125"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={onOpenSettings}
              className="p-3.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all flex-shrink-0 hover:scale-110"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 min-w-[140px] flex justify-end">
          <button 
            onClick={onLeave}
            title="Leave Meeting"
            className="w-16 h-14 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95 hover:scale-105"
          >
            <PhoneOff size={24} />
          </button>
        </div>

      </div>
      <style>{`
        @keyframes visualize {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default ControlBar;
