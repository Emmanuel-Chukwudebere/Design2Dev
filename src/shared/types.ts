// --- Core Types ---
export type Position = { x: number; y: number };
export type Dimensions = { width: number; height: number };

// --- Styling & Design Tokens ---
export type Color = {
  type: 'SOLID';
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
};

export type Gradient = {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  gradientStops: {
    position: number;
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  }[];
  gradientTransform: number[][];
};

export type Shadow = {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  offset: {
    x: number;
    y: number;
  };
  radius: number;
  spread: number;
  visible: boolean;
  blendMode: BlendMode;
};

// Manually define this type to avoid importing figma types in shared code
export type IndividualCorners = {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
}

export interface ImageFill {
  type: 'IMAGE';
  scaleMode: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
  imageHash: string;
  blendMode: BlendMode;
}

export interface BlurEffect {
  type: 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  radius: number;
  visible: boolean;
}

export type BlendMode = 
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

// Represents all possible styling for a node
export interface StyleProperties {
  // Basic properties
  opacity?: number;
  visible?: boolean;
  rotation?: number;
  blendMode?: BlendMode;
  locked?: boolean;
  preserveRatio?: boolean;
  zIndex?: number;
  
  // Layout properties
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' | 'BASELINE';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' | 'BASELINE';
  layoutAlign?: 'STRETCH' | 'INHERIT';
  layoutGrow?: number;
  layoutWrap?: 'WRAP' | 'NO_WRAP';
  layoutPosition?: 'ABSOLUTE' | 'RELATIVE';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  
  // Padding and spacing
  padding?: { top: number; right: number; bottom: number; left: number };
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  
  // Position and transform
  position?: { x: number; y: number };
  scale?: { x: number; y: number };
  
  // Visual properties
  borderRadius?: number;
  cornerRadius?: number;
  effects?: Effect[];
  fills?: (Color | Gradient | ImageFill)[];
  strokes?: (Color | Gradient)[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_EQUILATERAL' | 'LINE_ARROW';
  strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
  strokeMiterLimit?: number;
  strokeDashes?: number[];
  layoutGrids?: Array<{
    pattern: 'COLUMNS' | 'ROWS';
    sectionSize: number;
    visible: boolean;
    color: Color;
    alignment: 'MIN' | 'CENTER' | 'MAX';
    gutterSize: number;
    count: number;
    offset: number;
  }>;
  
  // Text properties
  fontSize?: number;
  fontName?: { family: string; style: string };
  lineHeight?: { value: number; unit: 'PIXELS' | 'PERCENT' };
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textAutoResize?: 'NONE' | 'HEIGHT' | 'WIDTH_AND_HEIGHT';
  
  // Constraints
  constraints?: {
    horizontal: HorizontalConstraint;
    vertical: VerticalConstraint;
  };
  
  // Export settings
  exportSettings?: Array<{
    format: 'JPG' | 'PNG' | 'SVG' | 'PDF';
    constraint?: {
      type: 'HEIGHT' | 'SCALE' | 'WIDTH';
      value: number;
    };
  }>;
  
  // Children
  children?: string[];
}

// --- Design System & Components ---
export type SupportedDesignSystem = 
  | 'react-native-paper'
  | 'react-native-elements'
  | 'native-base'
  | 'material-ui'
  | 'chakra-ui'
  | 'custom';

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

export interface InteractionState {
  state: 'hover' | 'active' | 'pressed';
  nodeId: string;
}

export interface ScreenSpec {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  layout: StyleProperties;
  designSystem: SupportedDesignSystem;
  elements: Element[];
  dependencies: string[];
  interactions: Record<string, InteractionState[]>;
  navigation?: {
    type: 'stack' | 'tab' | 'drawer';
    target: string;
  };
  prompt?: string;
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
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

// Update CornerRadius interface
export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

// Remove old ConstraintType
type ConstraintType = never;

export type HorizontalConstraint = 'CENTER' | 'STRETCH' | 'LEFT' | 'RIGHT' | 'SCALE';
export type VerticalConstraint = 'CENTER' | 'STRETCH' | 'TOP' | 'BOTTOM' | 'SCALE';

// Add type guards for Figma mixed values
export function isFontName(value: unknown): value is FontName {
  return typeof value === 'object' && value !== null && 'family' in value;
}

export function isLetterSpacing(value: unknown): value is number {
  return typeof value === 'number';
}

export function isLineHeight(value: unknown): value is number {
  return typeof value === 'number';
}

export function isTextCase(value: unknown): value is TextCase {
  return typeof value === 'string' && ['ORIGINAL', 'UPPER', 'LOWER', 'TITLE', 'SMALL_CAPS'].includes(value);
}

export function isTextDecoration(value: unknown): value is TextDecoration {
  return typeof value === 'string' && ['NONE', 'UNDERLINE', 'STRIKETHROUGH'].includes(value);
}

export function isLayoutAlign(value: unknown): value is LayoutAlign {
  return typeof value === 'string' && ['STRETCH', 'INHERIT', 'MIN', 'CENTER', 'MAX'].includes(value);
}

export function isHorizontalConstraint(value: unknown): value is HorizontalConstraint {
  return typeof value === 'string' && ['CENTER', 'STRETCH', 'LEFT', 'RIGHT', 'SCALE'].includes(value);
}

export function isVerticalConstraint(value: unknown): value is VerticalConstraint {
  return typeof value === 'string' && ['CENTER', 'STRETCH', 'TOP', 'BOTTOM', 'SCALE'].includes(value);
}

export type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS';
export type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
export type LayoutAlign = 'STRETCH' | 'INHERIT' | 'MIN' | 'CENTER' | 'MAX';

export interface Element {
  id: string;
  name: string;
  type: string;
  position: Position;
  dimensions: Dimensions;
  styling: StyleProperties;
  parent?: string;
  children?: string[];
  zIndex: number;
  effects?: Effect[];
  content?: string;
  textStyle?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textAlign: string;
    color: string;
  };
  autoLayout?: {
    direction: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    spacing: number;
    padding: number;
    layoutWrap?: 'WRAP' | 'NO_WRAP';
    layoutAlign?: 'STRETCH' | 'INHERIT';
    layoutGrow?: number;
  };
  gridLayout?: {
    columns: number;
    rows: number;
    spacing: number;
  };
  constraints?: {
    horizontal: HorizontalConstraint;
    vertical: VerticalConstraint;
  };
}