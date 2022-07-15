/* eslint-disable @typescript-eslint/no-explicit-any */
// Patch the removed `children` prop
declare namespace React {
  interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>, context?: any): ReactElement<any, any> | null
    propTypes?: WeakValidationMap<P> | undefined
    contextTypes?: ValidationMap<any> | undefined
    defaultProps?: Partial<P> | undefined
    displayName?: string | undefined
  }
}
