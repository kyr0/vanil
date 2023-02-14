/// <reference path="../dist/typings.d.ts" />

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'global!*.css' {
  export default function(): typeof JSXElement;
}

declare module 'global.css' {
  export default function(): typeof JSXElement;
}

declare module '*.mdx' {
  export default function(props: MDXProps): typeof JSXElement;
}

declare module '*.md' {
  export default function(props: MDXProps): typeof JSXElement;
}

declare module '*.svg' {
  export default function(): typeof JSXElement;
}

declare module '*.html' {
  export default function(): typeof JSXElement;
}