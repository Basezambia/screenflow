"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Home } from "./components/Home";
import { Room } from "./components/Room";
import { Button } from "./components/ui/button";
import { Toaster } from "react-hot-toast";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const { activeView } = useAppStore();

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <span>✓ Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  // Render different views based on activeView
  if (activeView === 'room') {
    return (
      <>
        <Room />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        {/* Header */}
        <div className="w-full max-w-md mx-auto px-4 py-3">
          <header className="flex justify-end items-center mb-3 h-11">
            <div>{saveFrameButton}</div>
          </header>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <Home />
        </main>

        {/* Footer */}
        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
