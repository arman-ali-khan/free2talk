export class WebRTCManager {
  private localStream: MediaStream | null = null
  private peerConnection: RTCPeerConnection | null = null
  private socket: any = null
  private roomId: string | null = null

  constructor() {
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: this.roomId,
        })
      }
    }

    this.peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0]
      }
    }
  }

  async startLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement
      if (localVideo) {
        localVideo.srcObject = this.localStream
      }

      if (this.peerConnection) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, this.localStream!)
        })
      }

      return this.localStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')
    
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')
    
    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')
    await this.peerConnection.setRemoteDescription(answer)
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')
    await this.peerConnection.addIceCandidate(candidate)
  }

  setSocket(socket: any) {
    this.socket = socket
  }

  setRoomId(roomId: string) {
    this.roomId = roomId
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }

  cleanup() {
    this.stopLocalStream()
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }
}