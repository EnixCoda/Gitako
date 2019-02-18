interface SvgrComponent extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}

declare module '*.svg?svgr' {
  const component: SvgrComponent
  export default component
}

type Omit<T, K extends keyof T> = Pick<
  T,
  ({ [P in keyof T]: P } & { [P in K]: never } & { [x: string]: never })[keyof T]
>
