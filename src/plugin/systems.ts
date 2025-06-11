// src/plugin/systems.ts

import { SupportedDesignSystem, DesignSystem } from '../shared/types';

interface ComponentConfig {
  name: string;
  variants?: Record<string, string>;
  states?: Record<string, string>;
  props?: Record<string, string>;
  dependencies?: string[];
}

export const designSystems: Record<SupportedDesignSystem, DesignSystem> = {
  'React Native Paper': {
    name: 'React Native Paper',
    description: 'Material Design for React Native',
    components: {
      button: {
        name: 'Button',
        variants: {
          contained: 'mode="contained"',
          outlined: 'mode="outlined"',
          text: 'mode="text"',
        },
        states: {
          disabled: 'disabled',
          loading: 'loading',
        },
        props: {
          icon: 'icon',
          label: 'label',
          onPress: 'onPress',
        },
      },
      card: {
        name: 'Card',
        variants: {
          elevated: 'mode="elevated"',
          outlined: 'mode="outlined"',
        },
        states: {
          disabled: 'disabled',
        },
        props: {
          title: 'title',
          content: 'content',
          actions: 'actions',
        },
      },
      text: {
        name: 'Text',
        variants: {
          h1: 'variant="headlineLarge"',
          h2: 'variant="headlineMedium"',
          h3: 'variant="headlineSmall"',
          body: 'variant="bodyLarge"',
          caption: 'variant="bodySmall"',
        },
        props: {
          children: 'children',
          style: 'style',
        },
      },
      input: {
        name: 'TextInput',
        variants: {
          outlined: 'mode="outlined"',
          flat: 'mode="flat"',
        },
        states: {
          disabled: 'disabled',
          error: 'error',
        },
        props: {
          label: 'label',
          value: 'value',
          onChangeText: 'onChangeText',
          placeholder: 'placeholder',
        },
      },
    },
    dependencies: ['react-native-paper', 'react-native-vector-icons'],
  },
  'Material UI': {
    name: 'Material UI',
    description: 'Material UI for React and React Native',
    components: {
      button: {
        name: 'Button',
        variants: {
          contained: 'variant="contained"',
          outlined: 'variant="outlined"',
          text: 'variant="text"',
        },
        states: {
          disabled: 'disabled',
          loading: 'loading',
        },
        props: {
          startIcon: 'startIcon',
          endIcon: 'endIcon',
          onClick: 'onClick',
        },
      },
      card: {
        name: 'Card',
        variants: {
          elevated: 'variant="elevated"',
          outlined: 'variant="outlined"',
        },
        states: {
          disabled: 'disabled',
        },
        props: {
          title: 'title',
          content: 'content',
          actions: 'actions',
        },
      },
      text: {
        name: 'Typography',
        variants: {
          h1: 'variant="h1"',
          h2: 'variant="h2"',
          h3: 'variant="h3"',
          body: 'variant="body1"',
          caption: 'variant="caption"',
        },
        props: {
          children: 'children',
          sx: 'sx',
        },
      },
      input: {
        name: 'TextField',
        variants: {
          outlined: 'variant="outlined"',
          filled: 'variant="filled"',
          standard: 'variant="standard"',
        },
        states: {
          disabled: 'disabled',
          error: 'error',
        },
        props: {
          label: 'label',
          value: 'value',
          onChange: 'onChange',
          placeholder: 'placeholder',
        },
      },
    },
    dependencies: ['@mui/material', '@emotion/react', '@emotion/styled'],
  },
  'Chakra UI': {
    name: 'Chakra UI',
    description: 'Accessible React component library',
    components: {
      button: {
        name: 'Button',
        variants: {
          solid: 'variant="solid"',
          outline: 'variant="outline"',
          ghost: 'variant="ghost"',
        },
        states: {
          disabled: 'isDisabled',
          loading: 'isLoading',
        },
        props: {
          leftIcon: 'leftIcon',
          rightIcon: 'rightIcon',
          onClick: 'onClick',
        },
      },
      card: {
        name: 'Card',
        variants: {
          elevated: 'variant="elevated"',
          outline: 'variant="outline"',
        },
        states: {
          disabled: 'isDisabled',
        },
        props: {
          title: 'title',
          children: 'children',
          footer: 'footer',
        },
      },
      text: {
        name: 'Text',
        variants: {
          h1: 'as="h1"',
          h2: 'as="h2"',
          h3: 'as="h3"',
          body: 'as="p"',
          caption: 'as="span"',
        },
        props: {
          children: 'children',
          sx: 'sx',
        },
      },
      input: {
        name: 'Input',
        variants: {
          outline: 'variant="outline"',
          filled: 'variant="filled"',
          flushed: 'variant="flushed"',
        },
        states: {
          disabled: 'isDisabled',
          error: 'isInvalid',
        },
        props: {
          placeholder: 'placeholder',
          value: 'value',
          onChange: 'onChange',
        },
      },
    },
    dependencies: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
  },
  'NativeBase': {
    name: 'NativeBase',
    description: 'Essential cross-platform UI components for React Native',
    components: {},
    dependencies: [],
  },
  'React Native Elements': {
    name: 'React Native Elements',
    description: 'Cross-platform React Native UI toolkit',
    components: {},
    dependencies: [],
  },
  'UI Kitten': {
    name: 'UI Kitten',
    description: 'React Native UI Library based on Eva Design System',
    components: {},
    dependencies: [],
  },
  'Custom': {
    name: 'Custom',
    description: 'Custom design system',
    components: {},
    dependencies: [],
  },
};