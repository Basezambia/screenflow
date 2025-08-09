// Dynamic import for client-side only
import type RecordRTCType from 'recordrtc';

let RecordRTC: typeof RecordRTCType | null = null;

// Only import RecordRTC on the client side
if (typeof window !== 'undefined') {
  import('recordrtc').then((module) => {
    RecordRTC = module.default;
  });
}

export interface RecordingOptions {
  type: 'screen' | 'camera' | 'both';
  audioSource: 'mic' | 'system' | 'both' | 'none';
  quality: 'low' | 'medium' | 'high';
  format: 'webm' | 'mp4';
}

export class RecordingService {
  private recorder: RecordRTCType | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private isPaused = false;
  private chunks: Blob[] = [];
  private startTime: number = 0;

  private async ensureRecordRTC(): Promise<void> {
    if (!RecordRTC && typeof window !== 'undefined') {
      const { default: RecordRTCLib } = await import('recordrtc');
      RecordRTC = RecordRTCLib;
    }
    if (!RecordRTC) {
      throw new Error('RecordRTC is not available in this environment');
    }
  }

  async startRecording(options: RecordingOptions): Promise<boolean> {
    if (typeof window === 'undefined') {
      throw new Error('Recording is only available in the browser');
    }

    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    try {
      await this.ensureRecordRTC();
      this.stream = await this.getRecordingStream(options);
      if (!this.stream) {
        throw new Error('Failed to get recording stream');
      }

      const recordingOptions = this.getRecordingOptions(options);
      
      if (RecordRTC) {
        this.recorder = new RecordRTC(this.stream, recordingOptions);
        this.recorder.startRecording();
      } else {
        throw new Error('RecordRTC is not available');
      }
      this.startTime = Date.now();
      this.isRecording = true;
      this.isPaused = false;
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.recorder.stopRecording(() => {
        const blob = this.recorder!.getBlob();
        this.isRecording = false;
        this.isPaused = false;
        this.cleanup();
        resolve(blob);
      });
    });
  }

  pauseRecording() {
    if (this.recorder && this.isRecording && !this.isPaused) {
      this.recorder.pauseRecording();
      this.isPaused = true;
    }
  }

  resumeRecording() {
    if (this.recorder && this.isRecording && this.isPaused) {
      this.recorder.resumeRecording();
      this.isPaused = false;
    }
  }

  getRecordingDuration(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  private async getRecordingStream(options: RecordingOptions): Promise<MediaStream | null> {
    try {
      let videoStream: MediaStream | null = null;
      let audioStream: MediaStream | null = null;

      // Get video stream
      if (options.type === 'screen' || options.type === 'both') {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor' as DisplayCaptureSurfaceType
          },
          audio: options.audioSource === 'system' || options.audioSource === 'both'
        });
      } else if (options.type === 'camera') {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: this.getVideoConstraints(options.quality),
          audio: false
        });
      }

      // Get audio stream
      if (options.audioSource === 'mic' || options.audioSource === 'both') {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
        } catch (error) {
          console.warn('Could not access microphone:', error);
        }
      }

      // Combine streams
      if (videoStream && audioStream) {
        const combinedStream = new MediaStream();
        
        videoStream.getVideoTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
        
        if (videoStream.getAudioTracks().length > 0) {
          videoStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
        }
        
        if (audioStream.getAudioTracks().length > 0) {
          audioStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
        }
        
        return combinedStream;
      }

      return videoStream || audioStream;
    } catch (error) {
      console.error('Error getting recording stream:', error);
      return null;
    }
  }

  private getVideoConstraints(quality: string) {
    switch (quality) {
      case 'high':
        return {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        };
      case 'medium':
        return {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 }
        };
      case 'low':
      default:
        return {
          width: { ideal: 854 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        };
    }
  }

  private getRecordingOptions(options: RecordingOptions) {
    const baseOptions = {
      type: 'video' as const,
      mimeType: 'video/webm;codecs=vp9' as const,
      recorderType: RecordRTC?.MediaStreamRecorder,
      timeSlice: 1000,
      ondataavailable: (blob: Blob) => {
        this.chunks.push(blob);
      }
    };

    switch (options.quality) {
      case 'high':
        return {
          ...baseOptions,
          videoBitsPerSecond: 8000000, // 8 Mbps
          audioBitsPerSecond: 128000   // 128 kbps
        };
      case 'medium':
        return {
          ...baseOptions,
          videoBitsPerSecond: 4000000, // 4 Mbps
          audioBitsPerSecond: 96000    // 96 kbps
        };
      case 'low':
      default:
        return {
          ...baseOptions,
          videoBitsPerSecond: 2000000, // 2 Mbps
          audioBitsPerSecond: 64000    // 64 kbps
        };
    }
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.recorder = null;
    this.chunks = [];
    this.startTime = 0;
    this.isRecording = false;
    this.isPaused = false;
  }

  downloadRecording(blob: Blob, filename?: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async uploadRecording(blob: Blob, uploadUrl: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('recording', blob, `recording-${Date.now()}.webm`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Error uploading recording:', error);
      return false;
    }
  }
}

export const recordingService = new RecordingService();