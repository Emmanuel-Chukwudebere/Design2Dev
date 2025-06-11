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
export type StyleProperties = {
  fills: (Color | Gradient)[];
  strokes: Color[];
  strokeWeight: number;
  cornerRadius: number | IndividualCorners; // For individual corner radii
  opacity: number;
  effects: Shadow[];
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAlign: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
  counterAlign: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  padding: { top: number; right: number; bottom: number; left: number };
  itemSpacing: number; // Corresponds to `gap`
  fontFamily: string | null;
  fontWeight: number | null;
  fontSize: number | null;
  lineHeight: number | null;
  letterSpacing: number | null;
  textAlign: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
};

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
  componentInstances: ComponentInstance[];
  dependencies: string[];
  permissions: string[];
}

export interface AIPrompt {
  componentName: string;
  designSystem: SupportedDesignSystem;
  specifications: string;
  accessibilityRequirements: string;
}

export interface ExportBundle {
  componentSpecs: ComponentSpec[];
  screenSpecs: ScreenSpec[];
  aiPrompts: AIPrompt[];
  assets: { name: string; data: Uint8Array }[];
  zipFile?: Uint8Array; // This property is now correctly defined
}

export interface DesignSystem {
  name: string;
  description: string;
  components: Record<string, any>;
  dependencies: string[];
}