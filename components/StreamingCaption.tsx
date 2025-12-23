
import React, { useEffect, useRef, useState } from 'react';
import { CaptionSegment } from '../types';

interface StreamingCaptionProps {
  captions: CaptionSegment[];
  visible: boolean;
}

const StreamingCaption: React.FC<StreamingCaptionProps> = ({ captions, visible }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fullText, setFullText] = useState('');

  // Accumulate text for streaming effect
  useEffect(() => {
    if (captions.length > 0) {
      const latest = captions[0];
      setFullText(prev => {
        const separator = prev ? ' • ' : '';
        const combined = prev + separator + latest.text;
        // Keep only last 500 characters to prevent memory issues
        return combined.slice(-500);
      });
    }
  }, [captions]);

  // Auto-scroll to the end (right) to show latest text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [fullText]);

  if (!visible || !fullText) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-24 left-0 right-0 h-12 flex items-center justify-center pointer-events-none z-30 px-4 md:px-12"
      style={{
        maskImage: 'linear-gradient(to right, transparent, white 15%, white 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, white 15%, white 85%, transparent)'
      }}
    >
      <div 
        ref={scrollRef}
        className="w-full max-w-4xl overflow-hidden whitespace-nowrap text-white text-lg md:text-xl font-medium tracking-tight flex items-center scroll-smooth no-scrollbar"
      >
        <span className="inline-block animate-orbit-in">
          {fullText}
        </span>
      </div>
    </div>
  );
};

export default StreamingCaption;
