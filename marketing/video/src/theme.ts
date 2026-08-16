// Same palette as website/lib/og-card.tsx — keep the reel's look consistent with
// the blog OG cards and the app's own dark UI.
export const INK = '#0A0E17';
export const PANEL = '#0F1520';
export const BORDER = '#1E2535';
export const GOLD = '#FDC003';
export const WHITE = '#FFFFFF';
export const MUTED = '#8A93A6';
export const CORRECT_GREEN = '#22C55E';

/** App logo under public/ — copied from website/public/logo.png. Unlike the audio
 * files this one DOES ship in the repo, so it needs no existence gate. */
export const LOGO_FILE = 'logo.png';

export const VERTICAL_LABEL: Record<string, string> = {
  engineering: 'PSU / GATE',
  entrance: 'JEE / NEET / CUET',
  govt: 'SSC / Banking / Police',
  college: 'College Degree',
  schooling: 'CBSE Class 9-12',
};

// Shown as pills in the CTA outro — the full app scope, not just today's vertical.
export const EXAM_COVERAGE = Object.values(VERTICAL_LABEL);
