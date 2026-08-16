import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Video } from 'remotion';
import { LandscapeOutro } from './LandscapeOutro';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', { weights: ['700'] });

// Length definitions
export const VIDEO_FPS = 24;
export const OUTRO_FRAMES = 96; // 4 seconds

export type LongFormEditProps = {
  videoDurationInSeconds?: number;
  videoFilename?: string;
};

const DEFAULT_VIDEO_DURATION = 473.129796;

export const calculateLongFormEditMetadata: CalculateMetadataFunction<LongFormEditProps> = ({ props }) => {
  const durationSec = props.videoDurationInSeconds ?? DEFAULT_VIDEO_DURATION;
  const trimmedDuration = Math.max(0, durationSec - 3);
  const trimmedFrames = Math.floor(trimmedDuration * VIDEO_FPS);
  const totalFrames = trimmedFrames + OUTRO_FRAMES;
  return {
    durationInFrames: totalFrames,
    props,
  };
};

export const LongFormEdit: React.FC<LongFormEditProps> = ({ 
  videoDurationInSeconds = DEFAULT_VIDEO_DURATION,
  videoFilename = 'long_form_temp.mp4'
}) => {
  const { durationInFrames } = useVideoConfig();
  const trimmedDuration = Math.max(0, videoDurationInSeconds - 3);
  const trimmedFrames = Math.floor(trimmedDuration * VIDEO_FPS);
  const outroFrames = Math.max(0, durationInFrames - trimmedFrames);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* 1. Main Video Sequence (Trimmed) */}
      <Sequence from={0} durationInFrames={trimmedFrames}>
        <Video 
          src={staticFile(videoFilename)} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* 2. Watermark masking layer */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 25,
          backgroundColor: '#000666',
          color: '#FDC003',
          fontFamily,
          fontWeight: 'bold',
          fontSize: 22,
          padding: '8px 16px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 10,
        }}>
          Aspirant Arcade
        </div>
      </Sequence>

      {/* 3. Outro Sequence */}
      <Sequence from={trimmedFrames} durationInFrames={outroFrames}>
        <LandscapeOutro hasOutro={true} />
      </Sequence>
    </AbsoluteFill>
  );
};
