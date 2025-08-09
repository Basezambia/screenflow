"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppStore } from '@/lib/store';
import {
  ConnectWallet,
  Wallet as WalletComponent,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { 
  Video, 
  Users, 
  Mic, 
  Plus, 
  LogIn,
  Settings,
  History,
  Wallet,
  Copy,
  Check,
  Share
} from 'lucide-react';
import { generateId, generateRoomCode, isValidRoomCode, copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';

export function Home() {
  const { address, isConnected } = useAccount();
  const { 
    user, 
    setUser, 
    setCurrentRoom, 
    addRoom, 
    setActiveView,
    rooms,
    privacySettings,
    updatePrivacySettings
  } = useAppStore();

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFeaturesPage, setShowFeaturesPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);

  // Initialize user when wallet is connected
  useEffect(() => {
    if (isConnected && address && !user) {
      setUser({
        id: generateId(),
        address,
        name: `User ${address.slice(-4)}`,
        isHost: false,
        isMuted: false,
        isVideoEnabled: true,
        isScreenSharing: false
      });
    }
  }, [isConnected, address, user, setUser]);

  const createRoom = async () => {
    if (!user || !roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setIsCreating(true);
    try {
      const roomId = generateId();
      const roomCode = generateRoomCode();
      
      const newRoom = {
        id: roomId,
        name: roomName.trim(),
        code: roomCode,
        host: user.id,
        participants: [{
          ...user,
          isHost: true
        }],
        isRecording: false,
        settings: {
          allowScreenShare: true,
          allowMicrophone: true,
          allowCamera: true,
          maxParticipants: 10
        }
      };

      addRoom(newRoom);
      setCurrentRoom(newRoom);
      setActiveView('room');
      
      toast.success('Room created successfully');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !joinCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    if (!isValidRoomCode(joinCode.toUpperCase())) {
      toast.error('Invalid room code format');
      return;
    }

    setIsJoining(true);
    try {
      // In a real app, you would fetch room details from your backend
      // For now, we'll simulate joining a room
      const roomId = generateId();
      
      const room = {
        id: roomId,
        name: `Room ${joinCode}`,
        code: joinCode.toUpperCase(),
        host: 'other-user',
        participants: [user],
        isRecording: false,
        settings: {
          allowScreenShare: true,
          allowMicrophone: true,
          allowCamera: true,
          maxParticipants: 10
        }
      };

      addRoom(room);
      setCurrentRoom(room);
      setActiveView('room');
      
      toast.success('Joined room successfully');
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const copyRoomCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      toast.success('Room code copied');
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      toast.error('Failed to copy room code');
    }
  };



  // Show wallet connection page if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-brutal font-black text-5xl uppercase tracking-wider text-foreground mb-6 border-b-8 border-foreground pb-6 inline-block">
              SCREEN FLOW
            </h1>

          </div>

          {/* Wallet Connection Card */}
          <div className="brutal-card p-12 text-center">
            <div className="w-20 h-20 bg-brutal-yellow border-5 border-foreground flex items-center justify-center mx-auto mb-8">
              <Wallet className="w-10 h-10 text-foreground" />
            </div>
            
            <h2 className="font-brutal font-black text-3xl uppercase tracking-wider mb-4">
              CONNECT WALLET
            </h2>
            
            <p className="text-lg text-muted-foreground font-mono uppercase tracking-wide mb-8">
              SECURE ACCESS TO WEB3 CONFERENCING
            </p>

            <div className="flex justify-center">
              <WalletComponent>
                <ConnectWallet className="brutal-button bg-brutal-blue text-white font-brutal font-bold uppercase tracking-wide px-8 py-4 text-lg border-3 border-foreground hover:bg-brutal-blue/80 transition-colors">
                  CONNECT WALLET
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </WalletComponent>
            </div>

            <div className="mt-8 pt-8 border-t-3 border-foreground">
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                SECURE • DECENTRALIZED • PRIVATE
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="font-brutal font-black text-5xl uppercase tracking-wider text-foreground mb-4 border-b-8 border-foreground pb-4 inline-block">
              SCREEN FLOW
            </h1>
            <div className="flex items-center space-x-6 mt-6">
              <button 
                onClick={() => setShowFeaturesPage(true)}
                className="text-xl text-muted-foreground font-mono uppercase tracking-wide hover:text-foreground transition-colors cursor-pointer border-b-2 border-transparent hover:border-foreground"
              >
                FEATURES
              </button>
              <span className="text-xl text-muted-foreground font-mono">•</span>
              <button 
                onClick={() => setShowSettingsPage(true)}
                className="text-xl text-muted-foreground font-mono uppercase tracking-wide hover:text-foreground transition-colors cursor-pointer border-b-2 border-transparent hover:border-foreground"
              >
                SETTINGS
              </button>
            </div>
          </div>
          
          {/* User Info & Wallet */}
          <div className="flex items-center space-x-6">
            {user && (
              <div className="flex items-center space-x-4 bg-muted border-3 border-foreground px-6 py-3">
                <div className="w-10 h-10 bg-brutal-yellow border-3 border-foreground flex items-center justify-center">
                  <span className="text-foreground font-brutal font-black text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-brutal font-bold text-base uppercase tracking-wide">{user.name}</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </p>
                </div>
              </div>
            )}
            
            <WalletComponent>
              <ConnectWallet className="brutal-button bg-brutal-blue text-white font-brutal font-bold uppercase tracking-wide px-6 py-3 border-3 border-foreground hover:bg-brutal-blue/80 transition-colors">
                <Name className="text-inherit" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </WalletComponent>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Create Room */}
          <div className="brutal-card p-10">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-brutal-green border-3 border-foreground flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h2 className="font-brutal font-black text-2xl uppercase tracking-wider">
                    CREATE ROOM
                  </h2>
                  <p className="text-base text-muted-foreground font-mono uppercase tracking-wide">
                    START NEW CONFERENCE
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <input
                className="brutal-input w-full text-lg py-4"
                placeholder="ENTER ROOM NAME"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              />
              <button 
                onClick={createRoom} 
                disabled={isCreating || !roomName.trim()}
                className="brutal-button w-full bg-brutal-green disabled:opacity-50 text-lg py-4 font-brutal font-bold uppercase tracking-wide"
              >
                {isCreating ? 'CREATING...' : 'CREATE ROOM'}
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="brutal-card p-10">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-brutal-blue border-3 border-foreground flex items-center justify-center mr-4">
                  <LogIn className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h2 className="font-brutal font-black text-2xl uppercase tracking-wider">
                    JOIN ROOM
                  </h2>
                  <p className="text-base text-muted-foreground font-mono uppercase tracking-wide">
                    ENTER ROOM CODE
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <input
                className="brutal-input w-full text-lg py-4"
                placeholder="ENTER CODE (ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                maxLength={6}
              />
              <button 
                onClick={joinRoom} 
                disabled={isJoining || !joinCode.trim()}
                className="brutal-button w-full bg-brutal-blue disabled:opacity-50 text-lg py-4 font-brutal font-bold uppercase tracking-wide"
              >
                {isJoining ? 'JOINING...' : 'JOIN ROOM'}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Rooms */}
        {rooms.length > 0 && (
          <div className="brutal-card p-brutal-xl mb-brutal-xl">
            <h2 className="flex items-center font-brutal font-black text-brutal-xl uppercase tracking-wider mb-brutal-lg">
              <History className="w-6 h-6 mr-brutal bg-brutal-yellow p-1 border-3 border-foreground" />
              RECENT ROOMS
            </h2>
            <div className="space-y-brutal">
              {rooms.slice(0, 5).map((room) => (
                <div key={room.id} className="flex items-center justify-between p-brutal-lg bg-muted border-3 border-foreground">
                  <div>
                    <h3 className="font-brutal font-bold text-brutal-base uppercase tracking-wide">{room.name}</h3>
                    <p className="text-brutal-xs text-muted-foreground font-mono uppercase tracking-wider">
                      {room.participants.length} PARTICIPANT{room.participants.length !== 1 ? 'S' : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-brutal">
                    <button
                      className="brutal-button-sm bg-background"
                      onClick={() => copyRoomCode(room.id.slice(0, 6).toUpperCase())}
                    >
                      {copiedCode === room.id.slice(0, 6).toUpperCase() ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="brutal-button-sm bg-brutal-green"
                      onClick={() => {
                        setCurrentRoom(room);
                        setActiveView('room');
                      }}
                    >
                      REJOIN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}





        {/* Features Page Modal */}
        {showFeaturesPage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
            <div className="bg-background border-5 border-foreground max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-8 border-b-3 border-foreground bg-brutal-yellow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white border-3 border-foreground flex items-center justify-center">
                      <Video className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h2 className="font-brutal font-black text-3xl uppercase tracking-wider">FEATURES</h2>
                      <p className="text-lg text-muted-foreground font-mono uppercase tracking-wide">
                        PROFESSIONAL VIDEO CONFERENCING PLATFORM
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFeaturesPage(false)}
                    className="w-10 h-10 bg-white border-3 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground font-bold text-xl">×</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="brutal-card p-6 bg-brutal-yellow">
                    <div className="flex items-center mb-4">
                      <Video className="w-8 h-8 text-foreground mr-4" />
                      <h3 className="font-brutal font-bold text-xl uppercase">HD VIDEO CALLS</h3>
                    </div>
                    <p className="font-mono text-sm leading-relaxed mb-4">
                      Experience crystal-clear video calls with professional quality streaming. Our platform supports up to 4K resolution with adaptive bitrate streaming for optimal performance across all devices.
                    </p>
                    <ul className="font-mono text-xs space-y-2">
                      <li>• 4K Video Resolution Support</li>
                      <li>• Adaptive Bitrate Streaming</li>
                      <li>• Low Latency Communication</li>
                      <li>• Cross-Platform Compatibility</li>
                    </ul>
                  </div>

                  <div className="brutal-card p-6 bg-brutal-green">
                    <div className="flex items-center mb-4">
                      <Share className="w-8 h-8 text-foreground mr-4" />
                      <h3 className="font-brutal font-bold text-xl uppercase">SCREEN SHARING</h3>
                    </div>
                    <p className="font-mono text-sm leading-relaxed mb-4">
                      Share your entire screen, specific applications, or browser tabs with high-quality audio. Perfect for presentations, demos, and collaborative work sessions.
                    </p>
                    <ul className="font-mono text-xs space-y-2">
                      <li>• Full Screen Sharing</li>
                      <li>• Application-Specific Sharing</li>
                      <li>• Audio Capture Support</li>
                      <li>• Real-time Annotation Tools</li>
                    </ul>
                  </div>

                  <div className="brutal-card p-6 bg-brutal-orange">
                    <div className="flex items-center mb-4">
                      <Mic className="w-8 h-8 text-foreground mr-4" />
                      <h3 className="font-brutal font-bold text-xl uppercase">AUDIO RECORDING</h3>
                    </div>
                    <p className="font-mono text-sm leading-relaxed mb-4">
                      Record high-quality audio from your meetings with advanced noise cancellation and echo suppression. Automatic transcription available for easy review.
                    </p>
                    <ul className="font-mono text-xs space-y-2">
                      <li>• High-Quality Audio Recording</li>
                      <li>• Noise Cancellation</li>
                      <li>• Automatic Transcription</li>
                      <li>• Cloud Storage Integration</li>
                    </ul>
                  </div>

                  <div className="brutal-card p-6 bg-brutal-blue">
                    <div className="flex items-center mb-4">
                      <Users className="w-8 h-8 text-foreground mr-4" />
                      <h3 className="font-brutal font-bold text-xl uppercase">COLLABORATION</h3>
                    </div>
                    <p className="font-mono text-sm leading-relaxed mb-4">
                      Real-time collaboration tools including whiteboard, file sharing, and synchronized presentations. Work together seamlessly from anywhere in the world.
                    </p>
                    <ul className="font-mono text-xs space-y-2">
                      <li>• Interactive Whiteboard</li>
                      <li>• File Sharing & Transfer</li>
                      <li>• Synchronized Presentations</li>
                      <li>• Real-time Chat</li>
                    </ul>
                  </div>
                </div>

                <div className="brutal-card p-6 bg-muted">
                  <h3 className="font-brutal font-bold text-xl uppercase mb-4">DECENTRALIZED ARCHITECTURE</h3>
                  <p className="font-mono text-sm leading-relaxed mb-4">
                    Built on blockchain technology for enhanced security, privacy, and decentralization. Your data remains under your control with end-to-end encryption and peer-to-peer communication.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brutal-yellow border-3 border-foreground flex items-center justify-center mx-auto mb-2">
                        <span className="font-brutal font-black">🔒</span>
                      </div>
                      <p className="font-mono text-xs uppercase">END-TO-END ENCRYPTION</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brutal-green border-3 border-foreground flex items-center justify-center mx-auto mb-2">
                        <span className="font-brutal font-black">🌐</span>
                      </div>
                      <p className="font-mono text-xs uppercase">PEER-TO-PEER NETWORK</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brutal-blue border-3 border-foreground flex items-center justify-center mx-auto mb-2">
                        <span className="font-brutal font-black">⛓️</span>
                      </div>
                      <p className="font-mono text-xs uppercase">BLOCKCHAIN POWERED</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Page Modal */}
        {showSettingsPage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
            <div className="bg-background border-5 border-foreground max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-8 border-b-3 border-foreground bg-brutal-blue">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white border-3 border-foreground flex items-center justify-center">
                      <Settings className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h2 className="font-brutal font-black text-3xl uppercase tracking-wider">SETTINGS</h2>
                      <p className="text-lg text-muted-foreground font-mono uppercase tracking-wide">
                        CONFIGURE YOUR EXPERIENCE
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSettingsPage(false)}
                    className="w-10 h-10 bg-white border-3 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground font-bold text-xl">×</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Audio Settings */}
                <div className="brutal-card p-6">
                  <h3 className="font-brutal font-bold text-xl uppercase mb-4 flex items-center">
                    <Mic className="w-6 h-6 mr-3" />
                    AUDIO SETTINGS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Microphone</label>
                      <select className="brutal-input w-64">
                        <option>Default Microphone</option>
                        <option>Built-in Microphone</option>
                        <option>External USB Microphone</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Speakers</label>
                      <select className="brutal-input w-64">
                        <option>Default Speakers</option>
                        <option>Built-in Speakers</option>
                        <option>Headphones</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Noise Cancellation</label>
                      <button className="brutal-button-sm bg-brutal-green">ENABLED</button>
                    </div>
                  </div>
                </div>

                {/* Video Settings */}
                <div className="brutal-card p-6">
                  <h3 className="font-brutal font-bold text-xl uppercase mb-4 flex items-center">
                    <Video className="w-6 h-6 mr-3" />
                    VIDEO SETTINGS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Camera</label>
                      <select className="brutal-input w-64">
                        <option>Default Camera</option>
                        <option>Built-in Camera</option>
                        <option>External Webcam</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Resolution</label>
                      <select className="brutal-input w-64">
                        <option>1080p HD</option>
                        <option>720p</option>
                        <option>4K Ultra HD</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Frame Rate</label>
                      <select className="brutal-input w-64">
                        <option>30 FPS</option>
                        <option>60 FPS</option>
                        <option>24 FPS</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="brutal-card p-6">
                  <h3 className="font-brutal font-bold text-xl uppercase mb-4 flex items-center">
                    <span className="w-6 h-6 mr-3 flex items-center justify-center">🔒</span>
                    PRIVACY SETTINGS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">End-to-End Encryption</label>
                      <button 
                        onClick={() => updatePrivacySettings({ endToEndEncryption: !privacySettings.endToEndEncryption })}
                        className={`brutal-button-sm ${privacySettings.endToEndEncryption ? 'bg-brutal-green' : 'bg-muted'}`}
                      >
                        {privacySettings.endToEndEncryption ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Data Storage</label>
                      <select 
                        className="brutal-input w-64"
                        value={privacySettings.dataStorage === 'local' ? 'Local Only' : 'Encrypted Cloud'}
                        onChange={(e) => updatePrivacySettings({ 
                          dataStorage: e.target.value === 'Local Only' ? 'local' : 'encrypted-cloud' 
                        })}
                      >
                        <option>Local Only</option>
                        <option>Encrypted Cloud</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Anonymous Mode</label>
                      <button 
                        onClick={() => updatePrivacySettings({ anonymousMode: !privacySettings.anonymousMode })}
                        className={`brutal-button-sm ${privacySettings.anonymousMode ? 'bg-brutal-green' : 'bg-muted'}`}
                      >
                        {privacySettings.anonymousMode ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Network Settings */}
                <div className="brutal-card p-6">
                  <h3 className="font-brutal font-bold text-xl uppercase mb-4 flex items-center">
                    <span className="w-6 h-6 mr-3 flex items-center justify-center">🌐</span>
                    NETWORK SETTINGS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Connection Type</label>
                      <select className="brutal-input w-64">
                        <option>Peer-to-Peer</option>
                        <option>Relay Server</option>
                        <option>Hybrid</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-sm uppercase">Bandwidth Limit</label>
                      <select className="brutal-input w-64">
                        <option>Unlimited</option>
                        <option>10 Mbps</option>
                        <option>5 Mbps</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}