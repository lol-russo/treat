declare module '*.md' {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

declare module '*.png' {
  let ImageSrc: string;
  export default ImageSrc;
}

declare module '@mdx-js/tag' {
  export const MDXProvider: (props: any) => JSX.Element;
}
