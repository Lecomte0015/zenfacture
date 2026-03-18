/// <reference types="vite/client" />

// Déclaration des types pour les fichiers JSX
declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}

// Déclaration des types pour les fichiers TSX
declare module '*.tsx' {
  import { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}

// Déclaration des types pour les modules CSS
interface CSSModuleClasses {
  [key: string]: string;
}

declare module '*.module.css' {
  const classes: CSSModuleClasses;
  export default classes;
}

declare module '*.module.scss' {
  const classes: CSSModuleClasses;
  export default classes;
}

// Déclaration des types pour les images
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Déclaration des types pour les fichiers JSON
declare module '*.json' {
  const value: any;
  export default value;
}
