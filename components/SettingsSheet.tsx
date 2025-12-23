import React, { useState } from 'react';
import { X, Camera, Mic, Languages, Globe, Sliders, Cpu, Link2, Monitor, LayoutGrid } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MediaDeviceInfo[];
  selectedVideo: string;
  selectedAudio: string;
  targetLang: string;
  onSelectVideo: (id: string) => void;
  onSelectAudio: (id: string) => void;
  onSelectLang: (lang: string) => void;
  
  // New props
  autoHideEnabled: boolean;
  onToggleAutoHide: (enabled: boolean) => void;
  audioSourceType: 'mic' | 'youtube' | 'stream';
  audioSourceUrl: string;
  onUpdateAudioSource: (type: 'mic' | 'youtube' | 'stream', url: string) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  devices,
  selectedVideo,
  selectedAudio,
  targetLang,
  onSelectVideo,
  onSelectAudio,
  onSelectLang,
  autoHideEnabled,
  onToggleAutoHide,
  audioSourceType,
  audioSourceUrl,
  onUpdateAudioSource
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'devices' | 'ai' | 'integrations'>('general');
  // Local state for URL input to avoid jitter
  const [urlInput, setUrlInput] = useState(audioSourceUrl);

  const handleUrlSave = () => {
    onUpdateAudioSource(audioSourceType, urlInput);
  };

  if (!isOpen) return null;

  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const audioDevices = devices.filter(d => d.kind === 'audioinput');

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative glass w-full md:w-1/2 h-full shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tighter">Settings</h3>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mt-1">Configure your Orbit workspace</p>
          </div>
          <button onClick={onClose} title="Close Settings" className="p-3 hover:bg-white/5 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-20 md:w-28 border-r border-white/5 flex flex-col items-center py-8 gap-6">
            <button 
              onClick={() => setActiveTab('general')}
              className={`p-4 rounded-2xl transition-all ${activeTab === 'general' ? 'bg-zinc-600 text-white shadow-lg shadow-zinc-500/20' : 'text-white/20 hover:text-white/40'}`}
              title="General"
            >
              <Sliders size={24} />
            </button>
            <button 
              onClick={() => setActiveTab('devices')}
              className={`p-4 rounded-2xl transition-all ${activeTab === 'devices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/20 hover:text-white/40'}`}
              title="Devices"
            >
              <Monitor size={24} />
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`p-4 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/20 hover:text-white/40'}`}
              title="AI Interpreter"
            >
              <Cpu size={24} />
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={`p-4 rounded-2xl transition-all ${activeTab === 'integrations' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'text-white/20 hover:text-white/40'}`}
              title="Integrations"
            >
              <Link2 size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12">

            {activeTab === 'general' && (
              <div className="space-y-10 animate-orbit-in">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-white">
                    <LayoutGrid size={20} className="text-white" />
                    <span className="text-sm font-black uppercase tracking-widest">Interface</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-sm font-bold">Auto-Hide Controls</p>
                      <p className="text-xs text-white/40 mt-1">Hide invalid icons after 5 seconds of inactivity</p>
                    </div>
                    <button 
                      onClick={() => onToggleAutoHide(!autoHideEnabled)}
                      title={autoHideEnabled ? 'Disable auto-hide' : 'Enable auto-hide'}
                      className={`w-14 h-8 rounded-full transition-all relative ${autoHideEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 bottom-1 w-6 rounded-full bg-white transition-all ${autoHideEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-white">
                    <Mic size={20} className="text-orange-500" />
                    <span className="text-sm font-black uppercase tracking-widest">Audio Source</span>
                  </div>
    
                  <div className="grid grid-cols-3 gap-3">
                    {['mic', 'youtube', 'stream'].map((type) => (
                      <button
                        key={type}
                        onClick={() => onUpdateAudioSource(type as any, audioSourceUrl)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${audioSourceType === type ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white/5 border-transparent hover:bg-white/10 text-white/40'}`}
                      >
                         <span className="capitalize font-bold text-sm">{type}</span>
                      </button>
                    ))}
                  </div>

                  {audioSourceType !== 'mic' && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">
                         {audioSourceType === 'youtube' ? 'YouTube URL' : 'Stream URL'}
                       </label>
                       <div className="flex gap-2">
                         <input 
                           type="text" 
                           value={urlInput}
                           onChange={(e) => setUrlInput(e.target.value)}
                           onBlur={handleUrlSave}
                           placeholder={audioSourceType === 'youtube' ? 'https://youtube.com/watch?v=...' : 'rtmp://...'}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-orange-500 transition-all font-bold"
                         />
                         <button onClick={handleUrlSave} className="px-6 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm">Save</button>
                       </div>
                     </div>
                  )}

                </section>
              </div>
            )}
            
            {activeTab === 'devices' && (
              <div className="space-y-10 animate-orbit-in">
                {/* Camera Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <Camera size={20} className="text-blue-500" />
                    <span className="text-sm font-black uppercase tracking-widest">Video Source</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {videoDevices.map(device => (
                      <button
                        key={device.deviceId}
                        onClick={() => onSelectVideo(device.deviceId)}
                        className={`w-full text-left px-5 py-4 rounded-2xl transition-all border ${
                          selectedVideo === device.deviceId 
                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                            : 'bg-white/5 border-transparent hover:bg-white/10 text-white/40'
                        }`}
                      >
                        <p className="text-sm font-bold truncate">{device.label || `Camera ${device.deviceId.slice(0, 5)}`}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Mic Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <Mic size={20} className="text-blue-500" />
                    <span className="text-sm font-black uppercase tracking-widest">Audio Input</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {audioDevices.map(device => (
                      <button
                        key={device.deviceId}
                        onClick={() => onSelectAudio(device.deviceId)}
                        className={`w-full text-left px-5 py-4 rounded-2xl transition-all border ${
                          selectedAudio === device.deviceId 
                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                            : 'bg-white/5 border-transparent hover:bg-white/10 text-white/40'
                        }`}
                      >
                        <p className="text-sm font-bold truncate">{device.label || `Mic ${device.deviceId.slice(0, 5)}`}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-10 animate-orbit-in">
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <Globe size={20} className="text-purple-500" />
                    <span className="text-sm font-black uppercase tracking-widest">Translation Output</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['English', 'Spanish', 'French', 'Japanese', 'Tagalog', 'Korean', 'German', 'Italian'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => onSelectLang(lang)}
                        className={`px-4 py-4 rounded-2xl transition-all border text-sm font-bold ${
                          targetLang === lang 
                            ? 'bg-purple-600/10 border-purple-500 text-white' 
                            : 'bg-white/5 border-transparent hover:bg-white/10 text-white/40'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </section>
                
                <section className="p-6 bg-purple-500/5 rounded-3xl border border-purple-500/10 space-y-3">
                   <h4 className="text-sm font-bold text-purple-400">Gemini Live Interpreter</h4>
                   <p className="text-xs text-white/40 leading-relaxed">
                     Orbit uses Gemini 2.5 Pro Native Audio for real-time speech-to-speech translation. Ensure your API key is configured for low-latency performance.
                   </p>
                </section>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-10 animate-orbit-in">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-white">
                    <Link2 size={20} className="text-orange-500" />
                    <span className="text-sm font-black uppercase tracking-widest">Active Connectors</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg" />
                        <div>
                          <p className="text-sm font-bold">Google Calendar</p>
                          <p className="text-[10px] text-white/20 font-black uppercase">Not Connected</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Connect</button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg" />
                        <div>
                          <p className="text-sm font-bold">Gemini API</p>
                          <p className="text-[10px] text-green-500 font-black uppercase">Active & Ready</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-600 rounded-lg" />
                        <div>
                          <p className="text-sm font-bold">Supabase DB</p>
                          <p className="text-[10px] text-white/20 font-black uppercase">Coming Soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/30 active:scale-95"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSheet;
