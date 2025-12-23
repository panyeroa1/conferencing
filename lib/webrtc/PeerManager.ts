
import { Participant } from '../../types';

export type SignalData = {
  type: 'offer' | 'answer' | 'ice';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
};

export type SignalMessage = {
  t: 'signal';
  from?: string;
  to?: string;
  data: SignalData;
};

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onSignal: (to: string, data: SignalData) => void;
  private onTrack: (pid: string, stream: MediaStream) => void;

  constructor(
    onSignal: (to: string, data: SignalData) => void,
    onTrack: (pid: string, stream: MediaStream) => void
  ) {
    this.onSignal = onSignal;
    this.onTrack = onTrack;
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    // Update existing peers with new tracks if they changed
    this.peers.forEach((pc) => {
      pc.getSenders().forEach((sender) => pc.removeTrack(sender));
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    });
  }

  async createPeer(pid: string, initiator: boolean) {
    if (this.peers.has(pid)) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.peers.set(pid, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSignal(pid, { type: 'ice', candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onTrack(pid, event.streams[0]);
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.onSignal(pid, { type: 'offer', sdp: offer.sdp });
    }

    return pc;
  }

  async handleSignal(from: string, data: SignalData) {
    let pc = this.peers.get(from);

    if (!pc) {
      pc = await this.createPeer(from, false);
    }

    if (!pc) return;

    if (data.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.onSignal(from, { type: 'answer', sdp: answer.sdp });
    } else if (data.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } else if (data.type === 'ice' && data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  removePeer(pid: string) {
    const pc = this.peers.get(pid);
    if (pc) {
      pc.close();
      this.peers.delete(pid);
    }
  }

  destroy() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
  }
}
