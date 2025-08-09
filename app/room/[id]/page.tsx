"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { Room } from '@/app/components/Room';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RoomPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const { user, setUser, setCurrentRoom, setActiveView } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const roomId = params.id as string;

  useEffect(() => {
    if (isConnected && address && !user) {
      // Auto-create user when wallet is connected
      const newUser = {
        id: generateId(),
        name: `User ${address.slice(-4)}`,
        address: address,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${address}`,
        isHost: false,
        isMuted: true, // Start muted by default
        isVideoEnabled: false, // Start with video off by default
        isScreenSharing: false
      };
      setUser(newUser);
    }
  }, [isConnected, address, user, setUser]);

  useEffect(() => {
    if (user && roomId) {
      // Create/join the room
      const room = {
        id: roomId,
        name: `Room ${roomId.slice(-6).toUpperCase()}`,
        code: roomId.slice(-6).toUpperCase(),
        host: user.id,
        participants: [{ ...user, isHost: true }],
        isRecording: false,
        settings: {
          allowScreenShare: true,
          allowMicrophone: true,
          allowCamera: true,
          maxParticipants: 10
        }
      };
      
      setCurrentRoom(room);
      setActiveView('room');
      setIsLoading(false);
      toast.success('Joined room successfully');
    }
  }, [user, roomId, setCurrentRoom, setActiveView]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-brutal">
        <div className="brutal-card p-brutal-xl max-w-md w-full text-center">
          <div className="mb-brutal-lg">
            <h1 className="font-brutal font-black text-brutal-2xl uppercase tracking-wider mb-brutal">
              SCREEN FLOW
            </h1>
            <p className="font-mono text-brutal-sm uppercase tracking-wider text-muted-foreground">
              Connect your wallet to join the room
            </p>
          </div>
          
          <div className="mb-brutal-lg">
            <div className="bg-brutal-yellow border-5 border-foreground p-brutal mb-brutal">
              <p className="font-brutal font-bold text-brutal-sm uppercase tracking-wider">
                Room ID: {roomId?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <ConnectWallet className="brutal-button bg-brutal-green">
              <span className="font-brutal font-bold uppercase tracking-wider">
                Connect Wallet
              </span>
            </ConnectWallet>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card p-brutal-xl">
          <p className="font-brutal font-bold text-brutal-lg uppercase tracking-wider">
            Loading Room...
          </p>
        </div>
      </div>
    );
  }

  return <Room />;
}