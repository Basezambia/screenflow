'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  Settings,
  Users,
  Square,
  Share,
  MessageCircle,
  Upload,
  Presentation,
  Send,
  Download,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn, formatDuration, copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';

// Dynamic imports for client-side services
let recordingService: typeof import('@/lib/recording').recordingService | null = null;
let webrtcService: typeof import('@/lib/webrtc').webrtcService | null = null;

if (typeof window !== 'undefined') {
  import('@/lib/recording').then((module) => {
    recordingService = module.recordingService;
  });
  
  import('@/lib/webrtc').then((module) => {
    webrtcService = module.webrtcService;
  });
}

interface VideoStreamProps {
  stream: MediaStream;
  isLocal?: boolean;
  participantName?: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
}

function VideoStream({ stream, isLocal, participantName, isMuted, isVideoEnabled }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-black border-4 border-foreground aspect-video overflow-hidden group hover:border-brutal-blue transition-all duration-300 hover:shadow-2xl hover:shadow-brutal-blue/20">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          !isVideoEnabled && "hidden",
          "group-hover:scale-105"
        )}
      />
      
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-brutal-yellow to-yellow-400 border-4 border-foreground flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-foreground font-brutal font-black text-2xl drop-shadow-lg">
                {participantName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-brutal-blue to-brutal-yellow opacity-20 blur-lg animate-pulse"></div>
          </div>
        </div>
      )}
      
      {/* Enhanced overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="absolute bottom-3 left-3 flex items-center space-x-2">
        <div className="backdrop-blur-md bg-black/70 border-2 border-white/20 px-3 py-1.5 rounded-lg">
          <span className="text-white font-mono text-sm font-bold tracking-wide drop-shadow-lg">
            {participantName || (isLocal ? 'YOU' : 'PARTICIPANT')}
          </span>
        </div>
        {isMuted && (
          <div className="bg-brutal-red/90 backdrop-blur-sm p-2 border-2 border-white/30 rounded-lg shadow-lg">
            <MicOff className="w-4 h-4 text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Connection indicator */}
      <div className="absolute top-3 right-3">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
      </div>
    </div>
  );
}

export function Room() {
  const {
    currentRoom,
    user,
    recording,
    showParticipants,
    showChat,
    showFileSharing,
    showPresentations,
    setRecording,
    toggleParticipants,
    toggleChat,
    toggleFileSharing,
    togglePresentations,
    setActiveView
  } = useAppStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peerStreams, setPeerStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Collaboration states
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: string, message: string, timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sharedFiles, setSharedFiles] = useState<Array<{id: string, name: string, size: number, type: string, url: string, uploadedBy: string, timestamp: Date}>>([]);
  
  // Presentation states
  const [presentationSlides, setPresentationSlides] = useState<Array<{id: string, name: string, url: string, type: string}>>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  // Media controls state - start with video and mic off by default
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Layout states for premium UI
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'files' | 'presentations'>('none');
  const [videoLayout, setVideoLayout] = useState<'grid' | 'speaker' | 'sidebar'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const initWebRTC = async () => {
      if (!webrtcService) {
        const { webrtcService: service } = await import('@/lib/webrtc');
        webrtcService = service;
      }

      if (webrtcService) {
        webrtcService.onPeerStream = (userId: string, stream: MediaStream) => {
          setPeerStreams(prev => new Map(prev.set(userId, stream)));
        };

        webrtcService.onPeerLeft = (userId: string) => {
          setPeerStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        };
      }
    };

    initWebRTC();

    return () => {
      if (webrtcService) {
        webrtcService.disconnect();
      }
    };
  }, []);

  const joinRoom = useCallback(async () => {
    if (!currentRoom || !user) return;

    setIsConnecting(true);
    try {
      if (!webrtcService) {
        const { webrtcService: service } = await import('@/lib/webrtc');
        webrtcService = service;
      }

      if (!webrtcService) {
        toast.error('WebRTC service not available');
        return;
      }

      // Get user media - ensure at least one of audio or video is requested
      // If both are disabled, default to audio enabled
      const requestVideo = isVideoEnabled;
      const requestAudio = !isMuted;
      
      // Ensure at least one is enabled
      const finalRequestAudio = requestAudio || !requestVideo;
      const finalRequestVideo = requestVideo;
      
      const stream = await webrtcService.getMediaStream(finalRequestVideo, finalRequestAudio);
      if (stream) {
        setLocalStream(stream);
        
        // If we forced audio on but user wanted it muted, mute it after getting the stream
        if (!requestAudio && finalRequestAudio) {
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
          }
        }
      }

      // Join the room
      await webrtcService.joinRoom(currentRoom.id, user.id, {
        name: user.name,
        address: user.address,
        avatar: user.avatar
      });

      toast.success('Joined room successfully');
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsConnecting(false);
    }
  }, [currentRoom, user, isVideoEnabled, isMuted]);

  // Join room on mount
  useEffect(() => {
    if (currentRoom && user) {
      joinRoom();
    }
  }, [currentRoom, user, joinRoom]);

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording.isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(Date.now() - (recording.startTime || Date.now()));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recording.isRecording, recording.startTime]);

  const leaveRoom = () => {
    if (webrtcService) {
      webrtcService.leaveRoom();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setActiveView('home');
    toast.success('Left room');
  };

  const toggleMute = () => {
    if (!webrtcService) {
      toast.error('WebRTC service not available');
      return;
    }
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
    toast.success(muted ? 'Microphone muted' : 'Microphone unmuted');
  };

  const toggleVideo = () => {
    if (!webrtcService) {
      toast.error('WebRTC service not available');
      return;
    }
    const disabled = webrtcService.toggleVideo();
    setIsVideoEnabled(!disabled);
    toast.success(disabled ? 'Camera disabled' : 'Camera enabled');
  };

  const toggleScreenShare = async () => {
    if (!webrtcService) {
      toast.error('WebRTC service not available');
      return;
    }

    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      setScreenStream(null);
      setIsScreenSharing(false);
      toast.success('Screen sharing stopped');
    } else {
      try {
        const stream = await webrtcService.getScreenStream(true);
        if (stream) {
          setScreenStream(stream);
          setIsScreenSharing(true);
          toast.success('Screen sharing started');
        }
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast.error('Failed to start screen sharing');
      }
    }
  };

  const startRecording = async () => {
    try {
      if (!recordingService) {
        const { recordingService: service } = await import('@/lib/recording');
        recordingService = service;
      }

      if (!recordingService) {
        toast.error('Recording service not available');
        return;
      }

      const success = await recordingService.startRecording({
        type: 'screen',
        audioSource: 'both',
        quality: 'medium',
        format: 'webm'
      });

      if (success) {
        setRecording({
          isRecording: true,
          startTime: Date.now()
        });
        toast.success('Recording started');
      } else {
        toast.error('Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingService) {
        toast.error('Recording service not available');
        return;
      }

      const blob = await recordingService.stopRecording();
      setRecording({
        isRecording: false,
        startTime: undefined
      });
      
      // Download the recording
      recordingService.downloadRecording(blob, `room-${currentRoom?.id}-${Date.now()}.webm`);
      toast.success('Recording saved');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  };

  const shareRoom = async () => {
    if (!currentRoom) return;
    
    const roomUrl = `${window.location.origin}/room/${currentRoom.id}`;
    const success = await copyToClipboard(roomUrl);
    
    if (success) {
      toast.success('Room link copied to clipboard');
    } else {
      toast.error('Failed to copy room link');
    }
  };

  // Collaboration functions
  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;
    
    const message = {
      id: Date.now().toString(),
      sender: user.name,
      message: newMessage.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    toast.success('Message sent');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    Array.from(files).forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      const sharedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        uploadedBy: user.name,
        timestamp: new Date()
      };
      
      setSharedFiles(prev => [...prev, sharedFile]);
      toast.success(`File "${file.name}" uploaded successfully`);
    });
  };

  const downloadFile = (file: {id: string, name: string, size: number, type: string, url: string, uploadedBy: string, timestamp: Date}) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${file.name}`);
  };

  // Enhanced panel toggle functions
  const toggleChatPanel = () => {
    setActivePanel(activePanel === 'chat' ? 'none' : 'chat');
    toggleChat();
  };

  const toggleFilesPanel = () => {
    setActivePanel(activePanel === 'files' ? 'none' : 'files');
    toggleFileSharing();
  };

  const togglePresentationsPanel = () => {
    setActivePanel(activePanel === 'presentations' ? 'none' : 'presentations');
    togglePresentations();
  };

  // Presentation functions
  const handleSlideUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const newSlide = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url,
          type: file.type
        };
        setPresentationSlides(prev => [...prev, newSlide]);
        toast.success(`Slide "${file.name}" uploaded successfully!`);
      } else {
        toast.error(`File "${file.name}" is not a valid image format.`);
      }
    });
  };

  const startPresentation = () => {
    if (presentationSlides.length === 0) {
      toast.error('Please upload slides first!');
      return;
    }
    setIsPresentationMode(true);
    setIsPresenting(true);
    setCurrentSlideIndex(0);
    toast.success('Presentation started!');
  };

  const stopPresentation = () => {
    setIsPresentationMode(false);
    setIsPresenting(false);
    toast.success('Presentation stopped!');
  };

  const nextSlide = () => {
    if (currentSlideIndex < presentationSlides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };





  // Pin participant for speaker view
  const pinParticipant = (participantId: string) => {
    setPinnedParticipant(pinnedParticipant === participantId ? null : participantId);
    setVideoLayout('speaker');
  };

  if (!currentRoom || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="brutal-card p-brutal-xl">
          <p className="font-brutal font-bold text-brutal-lg uppercase tracking-wider">NO ROOM SELECTED</p>
        </div>
      </div>
    );
  }

  const allStreams = [
    ...(localStream ? [{ stream: localStream, isLocal: true, participant: user }] : []),
    ...(screenStream ? [{ stream: screenStream, isLocal: true, participant: { ...user, name: `${user.name} (Screen)` } }] : []),
    ...Array.from(peerStreams.entries()).map(([userId, stream]) => ({
      stream,
      isLocal: false,
      participant: currentRoom.participants.find(p => p.id === userId) || { id: userId, name: 'Unknown', address: '', isHost: false, isMuted: false, isVideoEnabled: true, isScreenSharing: false }
    }))
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Main video area */}
      <div className="flex-1 flex flex-col">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 border-b-4 border-foreground shadow-xl px-6 py-4 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h1 className="font-brutal font-black text-3xl uppercase tracking-wider bg-gradient-to-r from-brutal-blue to-brutal-yellow bg-clip-text text-transparent drop-shadow-lg">
                  {currentRoom.name}
                </h1>
              </div>
              <button 
                onClick={async () => {
                  const success = await copyToClipboard(currentRoom.id);
                  if (success) {
                    toast.success('Room ID copied to clipboard');
                  } else {
                    toast.error('Failed to copy Room ID');
                  }
                }}
                className="text-sm font-mono text-muted-foreground hover:text-brutal-blue transition-all duration-300 cursor-pointer hover:scale-105 transform bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-brutal-blue"
                title="Click to copy Room ID"
              >
                Room ID: {currentRoom.id.slice(-8).toUpperCase()}
              </button>
              <div className="absolute -inset-1 bg-gradient-to-r from-brutal-blue to-brutal-yellow opacity-20 blur-lg -z-10"></div>
            </div>
            {recording.isRecording && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 border-3 border-foreground px-4 py-2 rounded-lg shadow-lg animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                <span className="text-sm font-mono font-bold text-white uppercase tracking-wider drop-shadow-lg">
                  REC {formatDuration(recordingDuration)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Video Layout Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setVideoLayout('grid')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  videoLayout === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setVideoLayout('speaker')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  videoLayout === 'speaker' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Speaker
              </button>
            </div>
            
            <button 
              className="bg-gradient-to-r from-brutal-blue to-blue-600 hover:from-blue-600 hover:to-brutal-blue text-white px-4 py-2 border-3 border-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold uppercase tracking-wide rounded-lg"
              onClick={shareRoom}
            >
              <Share className="w-4 h-4 mr-2" />
              SHARE
            </button>
            
            {/* Collaboration Buttons */}
            <button 
              className={cn(
                "px-4 py-2 border-3 border-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold uppercase tracking-wide rounded-lg",
                showChat 
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white" 
                  : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-green-400 hover:to-green-500 hover:text-white"
              )}
              onClick={toggleChatPanel}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              CHAT
            </button>
            
            <button 
              className={cn(
                "px-4 py-2 border-3 border-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold uppercase tracking-wide rounded-lg",
                showFileSharing 
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white" 
                  : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-purple-400 hover:to-purple-500 hover:text-white"
              )}
              onClick={toggleFilesPanel}
            >
              <Upload className="w-4 h-4 mr-2" />
              FILES
            </button>
            

            
            <button 
              className={cn(
                "px-4 py-2 border-3 border-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold uppercase tracking-wide rounded-lg",
                showPresentations 
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white" 
                  : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-indigo-400 hover:to-indigo-500 hover:text-white"
              )}
              onClick={togglePresentationsPanel}
            >
              <Presentation className="w-4 h-4 mr-2" />
              PRESENT
            </button>
            
            <button 
              className="bg-gradient-to-r from-brutal-yellow to-yellow-400 hover:from-yellow-400 hover:to-brutal-yellow text-foreground px-4 py-2 border-3 border-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold uppercase tracking-wide rounded-lg"
              onClick={toggleParticipants}
            >
              <Users className="w-4 h-4 mr-2" />
              {currentRoom.participants.length}
            </button>
          </div>
        </div>

        {/* Video Layout */}
        <div className="flex-1 p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
          {videoLayout === 'grid' ? (
            <div className={cn(
              "grid gap-6 h-full transition-all duration-500",
              allStreams.length === 0 && "grid-cols-1",
              allStreams.length === 1 && "grid-cols-1",
              allStreams.length === 2 && "grid-cols-2",
              allStreams.length <= 4 && allStreams.length > 2 && "grid-cols-2 grid-rows-2",
              allStreams.length > 4 && "grid-cols-3"
            )}>
              {allStreams.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-foreground shadow-2xl p-12 text-center rounded-2xl backdrop-blur-sm">
                      <div className="relative mb-6">
                        <Video className="w-24 h-24 mx-auto text-muted-foreground border-4 border-foreground p-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg" />
                        <div className="absolute -inset-2 bg-gradient-to-r from-brutal-blue to-brutal-yellow opacity-20 blur-xl rounded-xl"></div>
                      </div>
                      <p className="font-brutal font-bold text-2xl uppercase tracking-wider text-muted-foreground mb-2">
                        {isConnecting ? 'CONNECTING...' : 'NO VIDEO STREAMS'}
                      </p>
                      {isConnecting && (
                        <div className="flex justify-center space-x-1 mt-4">
                          <div className="w-2 h-2 bg-brutal-blue rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-brutal-yellow rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-brutal-red rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      )}
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-brutal-blue via-brutal-yellow to-brutal-red opacity-10 blur-2xl rounded-3xl"></div>
                  </div>
                </div>
              ) : (
                allStreams.map((streamData, index) => (
                  <div 
                    key={`${streamData.participant.id}-${index}`}
                    className="relative transform transition-all duration-300 hover:scale-[1.02] hover:z-10"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <VideoStream
                      stream={streamData.stream}
                      isLocal={streamData.isLocal}
                      participantName={streamData.participant.name}
                      isMuted={streamData.participant.isMuted}
                      isVideoEnabled={streamData.participant.isVideoEnabled}
                    />
                    <button
                      onClick={() => pinParticipant(streamData.participant.id)}
                      className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Speaker View */
            <div className="flex h-full gap-4">
              {/* Main speaker */}
              <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-2xl border border-gray-600">
                {pinnedParticipant && allStreams.find(s => s.participant.id === pinnedParticipant) ? (
                  <VideoStream
                    stream={allStreams.find(s => s.participant.id === pinnedParticipant)!.stream}
                    isLocal={allStreams.find(s => s.participant.id === pinnedParticipant)!.isLocal}
                    participantName={allStreams.find(s => s.participant.id === pinnedParticipant)!.participant.name}
                    isMuted={allStreams.find(s => s.participant.id === pinnedParticipant)!.participant.isMuted}
                    isVideoEnabled={allStreams.find(s => s.participant.id === pinnedParticipant)!.participant.isVideoEnabled}
                  />
                ) : allStreams.length > 0 ? (
                  <VideoStream
                    stream={allStreams[0].stream}
                    isLocal={allStreams[0].isLocal}
                    participantName={allStreams[0].participant.name}
                    isMuted={allStreams[0].participant.isMuted}
                    isVideoEnabled={allStreams[0].participant.isVideoEnabled}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white text-xl">No video streams</p>
                  </div>
                )}
              </div>
              
              {/* Participant thumbnails */}
              <div className="w-64 flex flex-col gap-3 overflow-y-auto">
                {allStreams.filter(s => s.participant.id !== pinnedParticipant).map((streamData, index) => (
                  <div 
                    key={`${streamData.participant.id}-thumb-${index}`}
                    className="relative bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg overflow-hidden shadow-lg border border-gray-600 aspect-video cursor-pointer hover:border-blue-500 transition-all"
                    onClick={() => pinParticipant(streamData.participant.id)}
                  >
                    <VideoStream
                      stream={streamData.stream}
                      isLocal={streamData.isLocal}
                      participantName={streamData.participant.name}
                      isMuted={streamData.participant.isMuted}
                      isVideoEnabled={streamData.participant.isVideoEnabled}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Controls */}
        <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t-4 border-foreground px-8 py-6 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-center space-x-4">
            <button
              className={cn(
                "relative group p-4 rounded-xl border-3 border-foreground shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl font-bold",
                isMuted 
                  ? "bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700" 
                  : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-green-400 hover:to-green-500 hover:text-white"
              )}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 opacity-20 blur-lg rounded-xl group-hover:opacity-40 transition-opacity"></div>
            </button>

            <button
              className={cn(
                "relative group p-4 rounded-xl border-3 border-foreground shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl font-bold",
                !isVideoEnabled 
                  ? "bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700" 
                  : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-blue-400 hover:to-blue-500 hover:text-white"
              )}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-20 blur-lg rounded-xl group-hover:opacity-40 transition-opacity"></div>
            </button>

            <button
              className={cn(
                "relative group p-4 rounded-xl border-3 border-foreground shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl font-bold",
                isScreenSharing 
                  ? "bg-gradient-to-br from-brutal-blue to-blue-600 text-white hover:from-blue-600 hover:to-blue-700" 
                  : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-brutal-blue hover:to-blue-500 hover:text-white"
              )}
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
              <div className="absolute -inset-1 bg-gradient-to-r from-brutal-blue to-blue-600 opacity-20 blur-lg rounded-xl group-hover:opacity-40 transition-opacity"></div>
            </button>

            <button
              className={cn(
                "relative group p-4 rounded-xl border-3 border-foreground shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl font-bold",
                recording.isRecording 
                  ? "bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 animate-pulse" 
                  : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-foreground hover:from-red-400 hover:to-red-500 hover:text-white"
              )}
              onClick={recording.isRecording ? stopRecording : startRecording}
            >
              {recording.isRecording ? <Square className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 opacity-20 blur-lg rounded-xl group-hover:opacity-40 transition-opacity"></div>
            </button>

            <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-400 to-transparent mx-2"></div>

            <button
              className="relative group bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 border-3 border-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold uppercase tracking-wide rounded-xl"
              onClick={leaveRoom}
            >
              <Phone className="w-5 h-5 mr-2" />
              LEAVE
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 opacity-30 blur-lg rounded-xl group-hover:opacity-50 transition-opacity"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar */}
      {showParticipants && (
        <div className="w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l-4 border-foreground flex flex-col shadow-2xl backdrop-blur-sm">
          <div className="p-6 border-b-4 border-foreground bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
            <h2 className="font-brutal font-black text-xl uppercase tracking-wider bg-gradient-to-r from-brutal-blue to-brutal-yellow bg-clip-text text-transparent">
              PARTICIPANTS ({currentRoom.participants.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentRoom.participants.map((participant, index) => (
              <div 
                key={participant.id} 
                className="flex items-center space-x-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-3 border-foreground p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideInRight 0.5s ease-out forwards'
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-brutal-yellow to-yellow-400 border-3 border-foreground flex items-center justify-center rounded-xl shadow-lg">
                    <span className="text-foreground font-brutal font-black text-lg drop-shadow-lg">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-brutal-yellow to-yellow-400 opacity-20 blur-lg rounded-xl"></div>
                  {participant.isHost && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-brutal font-bold text-sm uppercase tracking-wide text-foreground truncate">
                    {participant.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-md mt-1">
                    {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                  </p>
                </div>
                {participant.isHost && (
                  <span className="text-xs bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 font-mono font-bold uppercase tracking-wider border-2 border-foreground rounded-lg shadow-lg">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed right-4 top-20 bottom-20 w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-4 border-foreground rounded-xl shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b-4 border-foreground bg-gradient-to-r from-green-500 to-green-600">
            <div className="flex items-center justify-between">
              <h3 className="font-brutal font-bold text-white uppercase tracking-wider">CHAT</h3>
              <button onClick={toggleChat} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="bg-gray-100 dark:bg-gray-700 border-2 border-foreground p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-brutal font-bold text-xs uppercase text-green-600">{msg.sender}</span>
                  <span className="text-xs text-muted-foreground">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t-4 border-foreground">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border-2 border-foreground rounded-lg font-mono text-sm"
              />
              <button
                onClick={sendMessage}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 border-2 border-foreground rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Sharing Panel */}
      {showFileSharing && (
        <div className="fixed right-4 top-20 bottom-20 w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-4 border-foreground rounded-xl shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b-4 border-foreground bg-gradient-to-r from-purple-500 to-purple-600">
            <div className="flex items-center justify-between">
              <h3 className="font-brutal font-bold text-white uppercase tracking-wider">FILE SHARING</h3>
              <button onClick={toggleFileSharing} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 border-b-2 border-foreground">
            <label className="block">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 border-2 border-foreground rounded-lg cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all text-center font-bold uppercase">
                <Upload className="w-5 h-5 mx-auto mb-1" />
                UPLOAD FILES
              </div>
            </label>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sharedFiles.map((file) => (
              <div key={file.id} className="bg-gray-100 dark:bg-gray-700 border-2 border-foreground p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-brutal font-bold text-xs uppercase text-purple-600 truncate">{file.name}</span>
                  <button
                    onClick={() => downloadFile(file)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Size: {(file.size / 1024).toFixed(1)} KB</p>
                  <p>By: {file.uploadedBy}</p>
                  <p>At: {file.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Presentations Panel */}
      {showPresentations && (
        <div className="fixed inset-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-4 border-foreground rounded-xl shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b-4 border-foreground bg-gradient-to-r from-indigo-500 to-indigo-600">
            <div className="flex items-center justify-between">
              <h3 className="font-brutal font-bold text-white uppercase tracking-wider">PRESENTATIONS</h3>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <label className="bg-white text-indigo-600 px-3 py-1 rounded border-2 border-white font-bold text-xs cursor-pointer hover:bg-gray-100 transition-all">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleSlideUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 inline mr-1" />
                    UPLOAD
                  </label>
                  {presentationSlides.length > 0 && (
                    <button 
                      onClick={isPresenting ? stopPresentation : startPresentation}
                      className={cn(
                        "px-3 py-1 rounded border-2 border-white font-bold text-xs transition-all",
                        isPresenting 
                          ? "bg-red-500 text-white hover:bg-red-600" 
                          : "bg-green-500 text-white hover:bg-green-600"
                      )}
                    >
                      {isPresenting ? (
                        <>
                          <Pause className="w-4 h-4 inline mr-1" />
                          STOP
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 inline mr-1" />
                          START
                        </>
                      )}
                    </button>
                  )}
                </div>
                <button onClick={togglePresentations} className="text-white hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-gray-100 dark:bg-gray-200 relative">
            {presentationSlides.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-white border-4 border-foreground p-12 rounded-xl shadow-lg text-center">
                  <Presentation className="w-24 h-24 text-indigo-500 mx-auto mb-6" />
                  <h4 className="font-brutal font-bold text-2xl uppercase text-indigo-600 mb-4">UPLOAD SLIDES</h4>
                  <p className="text-muted-foreground mb-6">Upload images of your slides to start presenting</p>
                  <label className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 border-2 border-foreground rounded-lg font-bold uppercase hover:from-indigo-600 hover:to-indigo-700 transition-all cursor-pointer inline-flex items-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleSlideUpload}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 mr-2" />
                    UPLOAD SLIDES
                  </label>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="relative max-w-full max-h-full">
                  <Image
                    src={presentationSlides[currentSlideIndex].url}
                    alt={`Slide ${currentSlideIndex + 1}`}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain border-4 border-foreground rounded-lg shadow-2xl"
                  />
                  {isPresenting && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm animate-pulse">
                      PRESENTING
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {presentationSlides.length > 0 && (
            <div className="p-4 border-t-4 border-foreground bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-center space-x-4">
                <button 
                  onClick={previousSlide}
                  disabled={currentSlideIndex === 0}
                  className={cn(
                    "px-4 py-2 border-2 border-foreground rounded-lg font-bold transition-all",
                    currentSlideIndex === 0 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700"
                  )}
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <span className="font-brutal font-bold text-lg px-4">
                  SLIDE {currentSlideIndex + 1} / {presentationSlides.length}
                </span>
                <button 
                  onClick={nextSlide}
                  disabled={currentSlideIndex === presentationSlides.length - 1}
                  className={cn(
                    "px-4 py-2 border-2 border-foreground rounded-lg font-bold transition-all",
                    currentSlideIndex === presentationSlides.length - 1 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700"
                  )}
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}