// CSS module type declarations
// Fixes TS2882: Cannot find module or type declarations for side-effect import of '*.css'
declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}
