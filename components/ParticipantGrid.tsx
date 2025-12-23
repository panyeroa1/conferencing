
import React from 'react';
import { Participant } from '../types';
import { MicOff, User, MoreVertical } from 'lucide-react';

interface TileProps {
  participant: Participant;
  isMain?: boolean;
  isFull?: boolean;
}

const VideoTile: React.FC<TileProps> = ({ participant, isMain, isFull }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const tileClasses = isFull 
    ? "relative w-full h-full bg-zinc-950 overflow-hidden animate-orbit-in"
    : `video-tile group flex-1 min-w-[280px] h-full ${isMain ? 'active-speaker ring-2 ring-blue-500 ring-offset-4 ring-offset-black' : ''} animate-orbit-in rounded-2xl`;

  return (
    <div className={tileClasses}>
      {participant.videoEnabled && participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="w-full h-full object-cover scale-x-[-1] transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 transition-colors group-hover:bg-zinc-800">
          <div className="w-20 md:w-28 h-20 md:h-28 rounded-3xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 shadow-inner border border-white/5">
            <User size={48} className="text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-semibold tracking-wide text-sm">{participant.name}</p>
        </div>
      )}
      
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
        <div className="glass px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-2 pointer-events-auto">
          <div className={`w-1.5 h-1.5 rounded-sm ${participant.audioEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="truncate max-w-[80px] md:max-w-none">{participant.name} {participant.isLocal && '(You)'}</span>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          {!participant.audioEnabled && (
            <div className="bg-red-500/90 p-2 rounded-xl shadow-lg backdrop-blur-md">
              <MicOff size={16} />
            </div>
          )}
          {!isFull && (
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 opacity-0 group-hover:opacity-100 transition-all">
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface GridProps {
  participants: Participant[];
}

const ParticipantGrid: React.FC<GridProps> = ({ participants }) => {
  const count = participants.length;
  
  if (count === 0) return <div className="w-full h-full bg-black/40" />;

  if (count === 1) {
    return (
      <div className="w-full h-full bg-black">
        <VideoTile participant={participants[0]} isFull={true} />
      </div>
    );
  }

  let gridLayout = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 h-full p-3 md:p-8 content-center max-w-[1400px] mx-auto overflow-y-auto no-scrollbar";
  if (count === 2) gridLayout = "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-full p-4 md:p-8 content-center max-w-6xl mx-auto";

  return (
    <div className="w-full h-full overflow-hidden bg-black/40 pb-24">
      <div className={gridLayout}>
        {participants.map((p) => (
          <VideoTile key={p.id} participant={p} isMain={count > 1 && p.id === 'p2'} />
        ))}
      </div>
    </div>
  );
};

export default ParticipantGrid;
