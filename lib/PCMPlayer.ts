
export class PCMPlayer {
  private ctx: AudioContext;
  private nextStartTime: number = 0;
  private sampleRate: number;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  }

  async play(buffer: AudioBuffer) {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.nextStartTime = Math.max(this.nextStartTime, this.ctx.currentTime);
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  async playRaw(data: Uint8Array, numChannels: number = 1) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = this.ctx.createBuffer(numChannels, frameCount, this.sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    await this.play(buffer);
  }

  stop() {
    this.nextStartTime = 0;
  }
}
