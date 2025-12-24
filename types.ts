
export type PartCategory = 
  | 'Core' 
  | 'Display' 
  | 'Sensor' 
  | 'Power' 
  | 'Input' 
  | 'Actuator' 
  | 'Light' 
  | 'Structure' 
  | 'Comm' 
  | 'Passive';

export type StructureMaterial = 'Brass' | 'Acrylic' | 'Plywood' | '3D Print';
export type Difficulty = 'Easy' | 'Moderate' | 'Hard';
export type BatteryType = 'AA' | 'AAA' | '18650' | 'LiPo';
export type PowerType = BatteryType | 'USBC';

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  details?: {
    photoUrl?: string;
  };
}

export interface BOMItem {
  part: string;
  quantity: string;
  purpose: string;
  labelIndex?: number;
}

export interface MachineDesign {
  id: string;
  name: string;
  purpose: string;
  synergy: string;
  type: string;
  description: string;
  bom: BOMItem[];
  images: string[];
  analyzedBOM?: BOMItem[];
  schematic?: {
    nodes: SchematicNode[];
    edges: SchematicEdge[];
  };
  firmware?: string;
}

export interface MachineConfig {
  useBattery: boolean;
  powerType: PowerType;
  structureMaterial: StructureMaterial;
  difficulty: Difficulty;
  userPrompt: string;
  brassLight: boolean;
  brassWires: boolean;
  synthesisCount: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface SchematicNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
}

export interface SchematicEdge {
  from: string;
  to: string;
  label: string;
}