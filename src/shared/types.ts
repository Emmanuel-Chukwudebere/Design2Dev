// --- Core Types ---
export type Position = { x: number; y: number };
export type Dimensions = { width: number; height: number };

// --- Styling & Design Tokens ---
export type Color = { r: number; g: number; b: number; a: number };

export type Gradient = {
  type: 'LINEAR' | 'RADIAL';
  stops: { color: Color; position: number }[];
};

export type Shadow = {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  color: Color;
  offset: { x: number; y: number };
  blur: number;
  spread: number;
};

// Manually define this type to avoid importing figma types in shared code
export type IndividualCorners = {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
}

// Represents all possible styling for a node
export interface StyleProperties {
  fills?: (Color | Gradient)[];
  strokes?: Color[];
  strokeWeight?: number;
  cornerRadius?: number | IndividualCorners;
  opacity?: number;
  effects?: Shadow[];
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAlign?: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
  counterAlign?: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  padding?: { top: number; right: number; bottom: number; left: number };
  itemSpacing?: number;
  fontFamily?: string | null;
  fontWeight?: number | null;
  fontSize?: number | null;
  lineHeight?: number | null;
  letterSpacing?: number | null;
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
}

// --- Design System & Components ---
export type SupportedDesignSystem =
  | 'React Native Paper'
  | 'Material UI'
  | 'Chakra UI'
  | 'NativeBase'
  | 'React Native Elements'
  | 'UI Kitten'
  | 'Custom';

export type ComponentMapping = {
  designSystem: SupportedDesignSystem;
  mappedComponent: string | null;
  styleOverrides: (keyof StyleProperties)[];
};

export interface ComponentSpec {
  id: string;
  name: string;
  category: 'container' | 'interactive' | 'text' | 'image' | 'icon';
  styling: StyleProperties;
  dimensions: Dimensions;
  variants: ComponentSpec[];
  mapping: ComponentMapping;
  accessibility: {
    role: string;
    label: string | null;
  };
}

// --- Screen & Export Structure ---
export interface ComponentInstance {
  specId: string;
  position: Position;
  instanceProps: {
    text?: string;
    icon?: string;
  };
}

export interface ScreenSpec {
  id: string;
  name: string;
  dimensions: Dimensions;
  layout: StyleProperties;
  designSystem: SupportedDesignSystem;
  elements: {
    id: string;
    name: string;
    type: 'frame' | 'text' | 'image' | 'vector' | 'group';
    position: { x: number; y: number };
    dimensions: Dimensions;
    styling: StyleProperties;
    content?: string;
    children?: string[];
    autoLayout?: {
      direction: 'HORIZONTAL' | 'VERTICAL';
      alignment: string;
      spacing: number;
      padding: { top: number; right: number; bottom: number; left: number };
    };
    effects?: {
      type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
      properties: Record<string, any>;
    }[];
    constraints?: {
      horizontal: 'MIN' | 'MAX' | 'CENTER' | 'SCALE' | 'STRETCH';
      vertical: 'MIN' | 'MAX' | 'CENTER' | 'SCALE' | 'STRETCH';
    };
  }[];
  navigation?: {
    type: 'stack' | 'tab' | 'drawer';
    screens: string[];
  };
  dependencies: string[];
  permissions: string[];
}

export interface AIPrompt {
  screenName: string;
  designSystem: SupportedDesignSystem;
  specifications: string;
  accessibilityRequirements: string;
}

export interface ExportBundle {
  screenSpecs: ScreenSpec[];
  aiPrompts: AIPrompt[];
  assets: {
    name: string;
    data: Uint8Array;
  }[];
}

export interface DesignSystem {
  name: string;
  description: string;
  components: Record<string, any>;
  dependencies: string[];
}

export interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  color?: RGB;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  opacity?: number;
}