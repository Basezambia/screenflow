"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import {
  ConnectWallet,
  Wallet as WalletComponent,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Identity, Address, Avatar, EthBalance, Name } from "@coinbase/onchainkit/identity";
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
  Share2,
  Sparkles,
  ShieldCheck,
  AudioLines,
  GaugeCircle,
  ArrowRight,
  ChevronRight,
  Wifi,
  Cloud,
  Lock,
  Monitor,
} from "lucide-react";
import { generateId, generateRoomCode, isValidRoomCode, copyToClipboard } from "@/lib/utils";
import toast from "react-hot-toast";

const highlights = [
  {
    title: "Studio-grade video",
    description: "Adaptive streaming up to 4K keeps every face sharp, even on the move.",
    icon: Video,
  },
  {
    title: "Intelligent collaboration",
    description: "Live co-creation, synchronized notes, and AI summaries in one workspace.",
    icon: Sparkles,
  },
  {
    title: "Enterprise security",
    description: "End-to-end encryption with on-chain verifiability and audit trails.",
    icon: ShieldCheck,
  },
];

const featureShowcase = [
  {
    title: "Immersive sharing",
    description: "Share screens, stages, or prototypes with spatial audio and cinematic quality.",
    icon: Share2,
    accent: "from-sky-400/60 to-indigo-500/80",
  },
  {
    title: "Sound engineered",
    description: "Noise-aware mixing keeps every voice crisp with intelligent voice isolation.",
    icon: AudioLines,
    accent: "from-purple-500/60 to-pink-500/80",
  },
  {
    title: "Performance insights",
    description: "Realtime network health and participant analytics for proactive hosting.",
    icon: GaugeCircle,
    accent: "from-emerald-400/60 to-teal-500/80",
  },
];

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
    updatePrivacySettings,
  } = useAppStore();

  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFeaturesPage, setShowFeaturesPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);

  useEffect(() => {
    if (isConnected && address && !user) {
      setUser({
        id: generateId(),
        address,
        name: `Creator ${address.slice(-4)}`,
        isHost: false,
        isMuted: false,
        isVideoEnabled: true,
        isScreenSharing: false,
      });
    }
  }, [isConnected, address, user, setUser]);

  const totalParticipants = useMemo(
    () => rooms.reduce((count, room) => count + room.participants.length, 0),
    [rooms],
  );

  const createRoom = async () => {
    if (!user || !roomName.trim()) {
      toast.error("Please name your new space");
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
        participants: [
          {
            ...user,
            isHost: true,
          },
        ],
        isRecording: false,
        settings: {
          allowScreenShare: true,
          allowMicrophone: true,
          allowCamera: true,
          maxParticipants: 10,
        },
      };

      addRoom(newRoom);
      setCurrentRoom(newRoom);
      setActiveView("room");

      toast.success("Premium room launched ✨");
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("We couldn't start that room. Try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !joinCode.trim()) {
      toast.error("Enter a room code to continue");
      return;
    }

    if (!isValidRoomCode(joinCode.toUpperCase())) {
      toast.error("That room code doesn't look right");
      return;
    }

    setIsJoining(true);
    try {
      const roomId = generateId();

      const room = {
        id: roomId,
        name: `Session ${joinCode.toUpperCase()}`,
        code: joinCode.toUpperCase(),
        host: "other-user",
        participants: [user],
        isRecording: false,
        settings: {
          allowScreenShare: true,
          allowMicrophone: true,
          allowCamera: true,
          maxParticipants: 10,
        },
      };

      addRoom(room);
      setCurrentRoom(room);
      setActiveView("room");

      toast.success("You're in. Welcome back 👋");
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("We couldn't find that room. Try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const copyRoomCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      toast.success("Room code copied");
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      toast.error("Copy failed. Try manually.");
    }
  };

  if (!isConnected) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(236,72,153,0.22),_transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60 backdrop-blur-2xl" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <div className="max-w-4xl text-center">
            <div className="mx-auto mb-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white shadow-xl shadow-indigo-500/20">
              <Wallet className="h-8 w-8" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Step into premium on-chain collaboration
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              ScreenFlow delivers elevated video experiences secured by Base. Connect your wallet to unlock cinematic meetings, AI-assisted workflows, and verifiable privacy.
            </p>

            <div className="mt-12 flex justify-center">
              <div className="glass-card inline-flex flex-col items-center gap-4 px-8 py-10 text-left">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">Begin in moments</p>
                <WalletComponent>
                  <ConnectWallet className="primary-gradient flex items-center gap-3 rounded-full px-8 py-3 text-base font-semibold shadow-lg transition hover:scale-[1.02]">
                    <span>Connect wallet</span>
                    <ArrowRight className="h-4 w-4" />
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

            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div key={title} className="glass-card h-full rounded-2xl px-6 py-8 text-left">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white shadow-inner shadow-indigo-500/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),_transparent_55%)]" />
      <div className="absolute inset-y-0 left-0 h-[520px] w-[520px] -translate-x-1/3 bg-[radial-gradient(circle,_rgba(236,72,153,0.25),_transparent_65%)] blur-3xl" />
      <div className="absolute inset-y-0 right-0 h-[420px] w-[420px] translate-x-1/4 bg-[radial-gradient(circle,_rgba(56,189,248,0.25),_transparent_65%)] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-12">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-indigo-500/25">
                <span className="text-xl font-semibold">SF</span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300/70">ScreenFlow</p>
                <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">
                  Create signature meeting experiences
                </h1>
              </div>
            </div>
            <p className="text-base leading-relaxed text-slate-300">
              Launch curated rooms with cinematic video, spatial audio, and privacy you can verify on-chain. Designed for creators, teams, and communities who expect more from virtual collaboration.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300/80">
              <button
                onClick={() => setShowFeaturesPage(true)}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Explore features
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setShowSettingsPage(true)}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Personalize studio
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="glass-card w-full max-w-sm rounded-3xl p-6">
            <div className="flex items-center justify-between text-sm text-slate-300/80">
              <span>Connected as</span>
              <WalletComponent>
                <ConnectWallet className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20">
                  <Name className="text-[13px]" />
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
            {user && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{user.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-300/80">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-semibold text-white">{rooms.length}</p>
                    <span>Active rooms</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-semibold text-white">{totalParticipants}</p>
                    <span>Participants</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-semibold text-white">
                      {privacySettings.endToEndEncryption ? "On" : "Ready"}
                    </p>
                    <span>Encryption</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="mt-12 flex flex-1 flex-col gap-12">
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Launch instantly</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Create a signature room</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Name your experience, invite your collaborators, and unlock premium controls tailored for high-stakes conversations.
                  </p>
                </div>
                <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-400/40 text-emerald-200 lg:flex">
                  <Plus className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <input
                  className="glass-input w-full rounded-2xl px-5 py-4 text-base"
                  placeholder="Name your room"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createRoom()}
                />
                <button
                  onClick={createRoom}
                  disabled={isCreating || !roomName.trim()}
                  className="primary-gradient flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Designing your room..." : "Create premium room"}
                </button>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Rejoin effortlessly</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Enter with an access code</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Already invited? Enter the six-character code to jump straight into the experience.
                  </p>
                </div>
                <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/40 text-indigo-200 lg:flex">
                  <LogIn className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <input
                  className="glass-input w-full rounded-2xl px-5 py-4 text-base tracking-[0.3em]"
                  placeholder="ENTER CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  maxLength={6}
                />
                <button
                  onClick={joinRoom}
                  disabled={isJoining || !joinCode.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isJoining ? "Connecting..." : "Join existing room"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {featureShowcase.map(({ title, description, icon: Icon, accent }) => (
              <div key={title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:border-white/20">
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${accent}`} />
                <div className="relative z-10 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-200/80">{description}</p>
                </div>
              </div>
            ))}
          </section>

          {rooms.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Continue the flow</p>
                  <h2 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-white">
                    <History className="h-6 w-6" /> Recent rooms
                  </h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rooms.slice(0, 6).map((room) => (
                  <div key={room.id} className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                          {room.code}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {room.participants.length} participant{room.participants.length === 1 ? "" : "s"} • Host: {room.host === user?.id ? "You" : "Verified"}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                      <button
                        className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                        onClick={() => copyRoomCode(room.code)}
                      >
                        {copiedCode === room.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedCode === room.code ? "Copied" : "Copy code"}
                      </button>
                      <button
                        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
                        onClick={() => {
                          setCurrentRoom(room);
                          setActiveView("room");
                        }}
                      >
                        Rejoin
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 text-sm text-slate-400 lg:flex-row">
          <p>Built on Base with MiniKit · Elevating digital presence</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Wifi className="h-4 w-4" /> Adaptive bandwidth
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Cloud className="h-4 w-4" /> Encrypted archives
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="h-4 w-4" /> Zero-knowledge security
            </div>
          </div>
        </footer>
      </div>

      {showFeaturesPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-10">
          <div className="glass-card relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl p-0">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-8 py-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Premium capabilities</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Everything you need to produce unforgettable sessions</h2>
              </div>
              <button
                onClick={() => setShowFeaturesPage(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                ×
              </button>
            </div>

            <div className="custom-scrollbar space-y-8 overflow-y-auto px-8 py-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <Video className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">4K adaptive video</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Experience cinematic fidelity with bandwidth-aware encoding, auto-framing, and mood lighting enhancements that adapt to every participant.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200/80">
                    <li>• Dolby Vision ready streaming</li>
                    <li>• AI-enhanced light correction</li>
                    <li>• Smart presenter framing</li>
                    <li>• Device-aware optimization</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <Share2 className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">Immersive screen sharing</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Present screens, apps, or prototypes with layered audio routing and synchronized annotations for polished client experiences.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200/80">
                    <li>• Multi-source sharing & picture-in-picture</li>
                    <li>• Spatial audio mix for demos</li>
                    <li>• Interactive pointer & markup tools</li>
                    <li>• Secure guest hand-off mode</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <Mic className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">Production-grade audio</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Intelligent gain control, noise shaping, and studio-grade presets deliver broadcast-ready vocals without post-production.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200/80">
                    <li>• AI-powered voice isolation</li>
                    <li>• Real-time mastering & levels</li>
                    <li>• Automatic transcription & summaries</li>
                    <li>• Secure cloud archiving</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <Users className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">Collaborative brilliance</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Build together with synchronized whiteboards, real-time asset reviews, and workflow automations connected to your stack.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200/80">
                    <li>• Shared moodboards & canvases</li>
                    <li>• Instant asset approvals</li>
                    <li>• Integration-ready automations</li>
                    <li>• AI co-pilot for meeting notes</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-slate-900/80 p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-xl">
                    <h3 className="text-xl font-semibold text-white">Decentralized by design</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-200/80">
                      Built on Base with cryptographic signing, verifiable privacy policies, and granular admin controls. Every interaction is secured by modern web3 standards.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 text-sm text-white/90 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                      <ShieldCheck className="mb-3 h-6 w-6" />
                      <p className="font-semibold">E2E encryption</p>
                      <span className="text-xs text-slate-200/80">Zero-trust architecture with verifiable proofs</span>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                      <Monitor className="mb-3 h-6 w-6" />
                      <p className="font-semibold">Observability suite</p>
                      <span className="text-xs text-slate-200/80">Live diagnostics, sentiment, and engagement scoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-10">
          <div className="glass-card relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl p-0">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-8 py-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Studio preferences</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Tailor the experience to your flow</h2>
              </div>
              <button
                onClick={() => setShowSettingsPage(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                ×
              </button>
            </div>

            <div className="custom-scrollbar space-y-8 overflow-y-auto px-8 py-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="flex items-center gap-3 text-lg font-semibold text-white">
                    <Mic className="h-5 w-5" /> Audio routing
                  </h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span>Microphone</span>
                      <select className="glass-input w-40 rounded-xl px-4 py-2 text-sm">
                        <option>Studio USB</option>
                        <option>Built-in Mic</option>
                        <option>Wireless Lavalier</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Speakers</span>
                      <select className="glass-input w-40 rounded-xl px-4 py-2 text-sm">
                        <option>Spatial Mix</option>
                        <option>Built-in Output</option>
                        <option>Studio Monitors</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Noise shaping</span>
                      <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">Enabled</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="flex items-center gap-3 text-lg font-semibold text-white">
                    <Video className="h-5 w-5" /> Visual staging
                  </h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span>Camera</span>
                      <select className="glass-input w-40 rounded-xl px-4 py-2 text-sm">
                        <option>Default Camera</option>
                        <option>Mirrorless HDMI</option>
                        <option>External Webcam</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Resolution</span>
                      <select className="glass-input w-40 rounded-xl px-4 py-2 text-sm">
                        <option>1080p Studio</option>
                        <option>720p Balanced</option>
                        <option>4K Master</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Frame rate</span>
                      <select className="glass-input w-40 rounded-xl px-4 py-2 text-sm">
                        <option>30 FPS</option>
                        <option>60 FPS</option>
                        <option>24 FPS</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="flex items-center gap-3 text-lg font-semibold text-white">
                    <Lock className="h-5 w-5" /> Privacy controls
                  </h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span>End-to-end encryption</span>
                      <button
                        onClick={() => updatePrivacySettings({ endToEndEncryption: !privacySettings.endToEndEncryption })}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                          privacySettings.endToEndEncryption
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {privacySettings.endToEndEncryption ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Data storage</span>
                      <select
                        className="glass-input w-44 rounded-xl px-4 py-2 text-sm"
                        value={privacySettings.dataStorage === "local" ? "Local only" : "Encrypted cloud"}
                        onChange={(e) =>
                          updatePrivacySettings({
                            dataStorage: e.target.value === "Local only" ? "local" : "encrypted-cloud",
                          })
                        }
                      >
                        <option>Local only</option>
                        <option>Encrypted cloud</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Anonymous mode</span>
                      <button
                        onClick={() => updatePrivacySettings({ anonymousMode: !privacySettings.anonymousMode })}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                          privacySettings.anonymousMode
                            ? "bg-indigo-400/20 text-indigo-200"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {privacySettings.anonymousMode ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="flex items-center gap-3 text-lg font-semibold text-white">
                    <Wifi className="h-5 w-5" /> Network finesse
                  </h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span>Connection mode</span>
                      <select className="glass-input w-44 rounded-xl px-4 py-2 text-sm">
                        <option>Peer-to-peer</option>
                        <option>Relay optimized</option>
                        <option>Hybrid smart</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bandwidth profile</span>
                      <select className="glass-input w-44 rounded-xl px-4 py-2 text-sm">
                        <option>Unlimited</option>
                        <option>High fidelity</option>
                        <option>Data saver</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Diagnostics overlay</span>
                      <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                        Live metrics
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
