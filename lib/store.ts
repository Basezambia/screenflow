import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Participant {
  id: string;
  address: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
  peer?: import('simple-peer').Instance;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  host: string;
  participants: Participant[];
  isRecording: boolean;
  recordingStartTime?: number;
  settings: {
    allowScreenShare: boolean;
    allowMicrophone: boolean;
    allowCamera: boolean;
    maxParticipants: number;
  };
}

export interface RecordingState {
  isRecording: boolean;
  recordingType: 'screen' | 'camera' | 'both';
  audioSource: 'mic' | 'system' | 'both';
  recordedChunks: Blob[];
  recorder?: MediaRecorder;
  startTime?: number;
}

export interface PresentationSlide {
  id: string;
  content: string; // Base64 image or HTML content
  type: 'image' | 'html';
  notes?: string;
}

export interface PresentationData {
  id: string;
  title: string;
  slides: PresentationSlide[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface PresentationState {
  activePresentation: PresentationData | null;
  currentSlide: number;
  isPresenting: boolean;
  presenter: string | null;
}

export interface PrivacySettings {
  endToEndEncryption: boolean;
  dataStorage: 'local' | 'encrypted-cloud';
  anonymousMode: boolean;
}

interface AppState {
  // User state
  user: Participant | null;
  isConnected: boolean;
  
  // Room state
  currentRoom: Room | null;
  rooms: Room[];
  
  // Recording state
  recording: RecordingState;
  
  // Presentation state
  presentation: PresentationState;
  
  // Privacy settings
  privacySettings: PrivacySettings;
  
  // UI state
  activeView: 'home' | 'room' | 'settings';
  showParticipants: boolean;
  showChat: boolean;
  
  // Collaboration state
  showFileSharing: boolean;
  showPresentations: boolean;
  
  // Actions
  setUser: (user: Participant) => void;
  setConnected: (connected: boolean) => void;
  setCurrentRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;
  addParticipant: (roomId: string, participant: Participant) => void;
  removeParticipant: (roomId: string, participantId: string) => void;
  updateParticipant: (roomId: string, participantId: string, updates: Partial<Participant>) => void;
  setRecording: (recording: Partial<RecordingState>) => void;
  setActiveView: (view: 'home' | 'room' | 'settings') => void;
  toggleParticipants: () => void;
  toggleChat: () => void;
  toggleFileSharing: () => void;
  togglePresentations: () => void;
  setActivePresentation: (presentation: PresentationData | null) => void;
  setCurrentSlide: (slide: number) => void;
  setPresenting: (isPresenting: boolean, presenter?: string) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      isConnected: false,
      currentRoom: null,
      rooms: [],
      recording: {
        isRecording: false,
        recordingType: 'screen',
        audioSource: 'mic',
        recordedChunks: [],
      },
      presentation: {
        activePresentation: null,
        currentSlide: 0,
        isPresenting: false,
        presenter: null,
      },
      privacySettings: {
        endToEndEncryption: true,
        dataStorage: 'local',
        anonymousMode: true,
      },
      activeView: 'home',
      showParticipants: true,
      showChat: false,
      showFileSharing: false,
      showPresentations: false,

      // Actions
      setUser: (user) => set({ user }),
      setConnected: (isConnected) => set({ isConnected }),
      setCurrentRoom: (currentRoom) => set({ currentRoom }),
      
      addRoom: (room) => set((state) => ({
        rooms: [...state.rooms, room]
      })),
      
      updateRoom: (roomId, updates) => set((state) => ({
        rooms: state.rooms.map(room => 
          room.id === roomId ? { ...room, ...updates } : room
        ),
        currentRoom: state.currentRoom?.id === roomId 
          ? { ...state.currentRoom, ...updates }
          : state.currentRoom
      })),
      
      removeRoom: (roomId) => set((state) => ({
        rooms: state.rooms.filter(room => room.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom
      })),
      
      addParticipant: (roomId, participant) => set((state) => ({
        rooms: state.rooms.map(room => 
          room.id === roomId 
            ? { ...room, participants: [...room.participants, participant] }
            : room
        ),
        currentRoom: state.currentRoom?.id === roomId
          ? { ...state.currentRoom, participants: [...state.currentRoom.participants, participant] }
          : state.currentRoom
      })),
      
      removeParticipant: (roomId, participantId) => set((state) => ({
        rooms: state.rooms.map(room => 
          room.id === roomId 
            ? { ...room, participants: room.participants.filter(p => p.id !== participantId) }
            : room
        ),
        currentRoom: state.currentRoom?.id === roomId
          ? { ...state.currentRoom, participants: state.currentRoom.participants.filter(p => p.id !== participantId) }
          : state.currentRoom
      })),
      
      updateParticipant: (roomId, participantId, updates) => set((state) => ({
        rooms: state.rooms.map(room => 
          room.id === roomId 
            ? { 
                ...room, 
                participants: room.participants.map(p => 
                  p.id === participantId ? { ...p, ...updates } : p
                )
              }
            : room
        ),
        currentRoom: state.currentRoom?.id === roomId
          ? {
              ...state.currentRoom,
              participants: state.currentRoom.participants.map(p => 
                p.id === participantId ? { ...p, ...updates } : p
              )
            }
          : state.currentRoom
      })),
      
      setRecording: (recording) => set((state) => ({
        recording: { ...state.recording, ...recording }
      })),
      
      setActiveView: (activeView) => set({ activeView }),
      toggleParticipants: () => set((state) => ({ showParticipants: !state.showParticipants })),
      toggleChat: () => set((state) => ({ showChat: !state.showChat })),
      toggleFileSharing: () => set((state) => ({ showFileSharing: !state.showFileSharing })),
      togglePresentations: () => set((state) => ({ showPresentations: !state.showPresentations })),
      
      setActivePresentation: (activePresentation) => set((state) => ({
        presentation: { ...state.presentation, activePresentation, currentSlide: 0 }
      })),
      
      setCurrentSlide: (currentSlide) => set((state) => ({
        presentation: { ...state.presentation, currentSlide }
      })),
      
      setPresenting: (isPresenting, presenter) => set((state) => ({
        presentation: { ...state.presentation, isPresenting, presenter: presenter || null }
      })),
      
      updatePrivacySettings: (settings) => set((state) => ({
        privacySettings: { ...state.privacySettings, ...settings }
      })),
    }),
    {
      name: 'kopa-store',
    }
  )
);