
import React from 'react';
/* Added missing Hand icon import */
import { X, Users, ScrollText, UserMinus, Shield, Mic, MicOff, VolumeX, Volume2, Video, VideoOff, MessageSquare, Send, Hand } from 'lucide-react';
import { CaptionSegment, Participant, Message } from '../types';

interface RightPanelProps {
  onClose: () => void;
  activeTab: 'captions' | 'people' | 'chat';
  setActiveTab: (tab: 'captions' | 'people' | 'chat') => void;
  captions: CaptionSegment[];
  participants: Participant[];
  localParticipant: Participant;
  onRemoveParticipant: (id: string) => void;
  onMuteAll: (mute: boolean) => void;
  onToggleParticipantMute: (pid: string, mute: boolean) => void;
  onToggleParticipantVideo: (pid: string, enabled: boolean) => void;
  // Chat props
  messages?: Message[];
  onSendMessage?: (content: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  onClose, 
  activeTab,
  setActiveTab,
  captions, 
  participants, 
  localParticipant,
  onRemoveParticipant,
  onMuteAll,
  onToggleParticipantMute,
  onToggleParticipantVideo,
  messages = [],
  onSendMessage
}) => {
  const isHost = localParticipant.role === 'host';
  const [chatMessage, setChatMessage] = React.useState('');
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (chatMessage.trim() && onSendMessage) {
      onSendMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full md:w-96 h-full glass border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('captions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'captions' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <ScrollText size={16} />
            <span className="font-semibold text-xs">Captions</span>
          </button>
          <button 
             onClick={() => setActiveTab('people')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'people' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <Users size={16} />
            <span className="font-semibold text-xs">People ({participants.length})</span>
          </button>
          <button 
             onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <MessageSquare size={16} />
            <span className="font-semibold text-xs">Chat</span>
          </button>
        </div>
        <button onClick={onClose} title="Close panel" className="p-2 hover:bg-white/10 rounded-full transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'captions' && (
          captions.length > 0 ? (
            captions.map((c) => (
              <div key={c.id} className="space-y-1 animate-orbit-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{c.speakerName}</span>
                  <span className="text-[10px] text-white/30">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {c.text}
                </p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
              <ScrollText size={48} />
              <p className="text-sm">No captions yet.</p>
            </div>
          )
        )}

        {activeTab === 'people' && (
          <div className="space-y-4">
            {isHost && (
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => onMuteAll(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl border border-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                >
                  <VolumeX size={12} />
                  Mute All
                </button>
                <button 
                  onClick={() => onMuteAll(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-2 rounded-xl border border-blue-500/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                >
                  <Volume2 size={12} />
                  Unmute
                </button>
              </div>
            )}
            
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold border border-white/5 shadow-inner">
                      {p.name.charAt(0)}
                    </div>
                    {p.handRaised && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black p-1 rounded-full animate-bounce">
                        <Hand size={10} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate max-w-[120px]">{p.name} {p.isLocal && '(You)'}</p>
                      {p.role === 'host' && <Shield size={12} className="text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">{p.role}</p>
                      <div className="flex items-center gap-1">
                        {!p.audioEnabled && <MicOff size={10} className="text-red-500" />}
                        {!p.videoEnabled && <VideoOff size={10} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isHost && !p.isLocal && (
                      <>
                        <button 
                          onClick={() => onToggleParticipantMute(p.id, p.audioEnabled)}
                          className={`p-2 rounded-lg transition-all ${p.audioEnabled ? 'text-white/20 hover:text-red-500 hover:bg-red-500/10' : 'text-blue-500 bg-blue-500/10'}`}
                        >
                          {p.audioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                        </button>
                        <button 
                          onClick={() => onToggleParticipantVideo(p.id, p.videoEnabled)}
                          className={`p-2 rounded-lg transition-all ${p.videoEnabled ? 'text-white/20 hover:text-red-500 hover:bg-red-500/10' : 'text-blue-500 bg-blue-500/10'}`}
                        >
                          {p.videoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                        </button>
                        <button 
                          onClick={() => onRemoveParticipant(p.id)}
                          title="Remove participant"
                          className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <UserMinus size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {messages.length > 0 ? (
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="animate-orbit-in">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-400">{msg.senderName || 'Anonymous'}</span>
                      <span className="text-[10px] text-white/30">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 bg-white/5 p-3 rounded-xl border border-white/5">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-4">
                <MessageSquare size={48} />
                <p className="text-sm">Messages sent here are visible to everyone in the room.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'chat' && (
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="relative">
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm outline-none focus:border-blue-500 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              disabled={!chatMessage.trim()}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
