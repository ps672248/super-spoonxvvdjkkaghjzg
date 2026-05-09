export type BranchConfig = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  icon: string; // Ionicons name
};

export const BRANCHES: BranchConfig[] = [
  { id: 'mechanical',     name: 'Mechanical Engineering',          shortName: 'ME',   color: '#F57C00', bgColor: '#FFF3E0', icon: 'settings' },
  { id: 'electrical',     name: 'Electrical Engineering',          shortName: 'EE',   color: '#1976D2', bgColor: '#E3F2FD', icon: 'flash' },
  { id: 'civil',          name: 'Civil Engineering',               shortName: 'CE',   color: '#388E3C', bgColor: '#E8F5E9', icon: 'construct' },
  { id: 'chemical',       name: 'Chemical Engineering',            shortName: 'CHE',  color: '#7B1FA2', bgColor: '#F3E5F5', icon: 'flask' },
  { id: 'cs',             name: 'Computer Science / IT',           shortName: 'CS',   color: '#00796B', bgColor: '#E0F2F1', icon: 'code-slash' },
  { id: 'electronics',    name: 'Electronics & Instrumentation',   shortName: 'EC',   color: '#E64A19', bgColor: '#FBE9E7', icon: 'hardware-chip' },
  { id: 'metallurgy',     name: 'Metallurgy Engineering',          shortName: 'MET',  color: '#5D4037', bgColor: '#EFEBE9', icon: 'layers' },
  { id: 'mining',         name: 'Mining Engineering',              shortName: 'MN',   color: '#455A64', bgColor: '#ECEFF1', icon: 'trending-down' },
  { id: 'petroleum',      name: 'Petroleum Engineering',           shortName: 'PE',   color: '#F9A825', bgColor: '#FFFDE7', icon: 'water' },
  { id: 'geophysics',     name: 'Geophysics',                      shortName: 'GEO',  color: '#558B2F', bgColor: '#F1F8E9', icon: 'earth' },
  { id: 'hr_finance',     name: 'HR / Finance / Management',       shortName: 'HR',   color: '#AD1457', bgColor: '#FCE4EC', icon: 'people' },
];

export const getBranch = (id: string): BranchConfig | undefined =>
  BRANCHES.find(b => b.id === id);
