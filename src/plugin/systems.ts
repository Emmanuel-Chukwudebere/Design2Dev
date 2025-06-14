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
  'react-native-paper': {
    name: 'React Native Paper',
    description: 'Material Design components for React Native',
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
  'react-native-elements': {
    name: 'React Native Elements',
    description: 'Cross-platform React Native UI toolkit',
    components: {
      button: {
        name: 'Button',
        variants: {
          solid: 'type="solid"',
          outline: 'type="outline"',
          clear: 'type="clear"',
        },
        states: {
          disabled: 'disabled',
          loading: 'loading',
        },
        props: {
          icon: 'icon',
          title: 'title',
          onPress: 'onPress',
        },
      },
      card: {
        name: 'Card',
        variants: {
          elevated: 'containerStyle={{ elevation: 4 }}',
          outlined: 'containerStyle={{ borderWidth: 1 }}',
        },
        states: {
          disabled: 'disabled',
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
          h1: 'h1',
          h2: 'h2',
          h3: 'h3',
          body: 'p',
          caption: 'caption',
        },
        props: {
          children: 'children',
          style: 'style',
        },
      },
      input: {
        name: 'Input',
        variants: {
          outlined: 'containerStyle={{ borderWidth: 1 }}',
          underlined: 'containerStyle={{ borderBottomWidth: 1 }}',
        },
        states: {
          disabled: 'disabled',
          error: 'errorMessage',
        },
        props: {
          label: 'label',
          value: 'value',
          onChangeText: 'onChangeText',
          placeholder: 'placeholder',
        },
      },
    },
    dependencies: ['@rneui/themed', '@rneui/base'],
  },
  'native-base': {
    name: 'NativeBase',
    description: 'Essential cross-platform UI components for React Native',
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
          onPress: 'onPress',
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
          h1: 'fontSize="2xl"',
          h2: 'fontSize="xl"',
          h3: 'fontSize="lg"',
          body: 'fontSize="md"',
          caption: 'fontSize="sm"',
        },
        props: {
          children: 'children',
          style: 'style',
        },
      },
      input: {
        name: 'Input',
        variants: {
          outline: 'variant="outline"',
          filled: 'variant="filled"',
          rounded: 'variant="rounded"',
        },
        states: {
          disabled: 'isDisabled',
          error: 'isInvalid',
        },
        props: {
          placeholder: 'placeholder',
          value: 'value',
          onChangeText: 'onChangeText',
        },
      },
    },
    dependencies: ['native-base'],
  },
  'material-ui': {
    name: 'Material UI',
    description: 'React components that implement Google\'s Material Design',
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
  'chakra-ui': {
    name: 'Chakra UI',
    description: 'Simple, modular and accessible component library for React',
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
        name: 'Box',
        variants: {
          elevated: 'shadow="md"',
          outlined: 'borderWidth="1px"',
        },
        states: {
          disabled: 'isDisabled',
        },
        props: {
          children: 'children',
          p: 'p',
          m: 'm',
        },
      },
      text: {
        name: 'Text',
        variants: {
          h1: 'fontSize="4xl"',
          h2: 'fontSize="3xl"',
          h3: 'fontSize="2xl"',
          body: 'fontSize="md"',
          caption: 'fontSize="sm"',
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
  'custom': {
    name: 'Custom',
    description: 'Custom design system',
    components: {},
    dependencies: [],
  }
};