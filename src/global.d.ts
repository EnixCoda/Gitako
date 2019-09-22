interface SvgrComponent extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}

declare module '*.svg?svgr' {
  const component: SvgrComponent
  export default component
}
