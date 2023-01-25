// ref for file syntax, it basically inherits from `.gitignore`: https://www.git-scm.com/docs/gitignore#_pattern_format
// ref for `.gitattributes` file: https://www.git-scm.com/docs/gitattributes#_description
// ref for `linguist-generated` attribute https://github.com/github/linguist

type X<Value, Inputs extends any[]> = Value | ((...inputs: Inputs) => Value)

function createMachine<Input, States extends string, State>(
  stateCreator: () => State,
  map: {
    [key in States]?: X<States | null, [input: Input, state: State]>
  },
) {
  return (input: Input): State => {
    const state = stateCreator()
    return state
  }
}

// This function does not support all attributes defined for `.gitattributes` file
// It is only used to recognize `linguist-generated` and filter files
export function resolveGitAttributes(root: TreeNode, content: string) {
  content
    .split('\n')
    .map(line => line.trim())
    .forEach(line => {
      type States = 'init' | 'comment' | 'negative' | 'pre-patterns' | 'pattern' | 'c-pattern' | 'error'

      const machine = createMachine<
        string,
        States,
        {
          pattern: string | null
          error: unknown
          negative: boolean
        }
      >(
        () => ({
          pattern: null,
          negative: false,
          error: null
        }),
        {
          /**
           * stateName: [
           *   patternSwitcher: X<string | null, [char: string, state: State]>,
           * ]
           */
          init:
            c =>
            (({
              '#': 'comment',
              '!': 'negative',
            } satisfies Partial<{
              [key: string]: States
            }>)[c] || 'pre-patterns'),
          comment: () => null,
          negative:
            (c, state) => {
              state.negative = true
              return 'pattern'
            },
          "pre-patterns": c => c === '"' ? 'c-pattern' : 'pattern',
          'c-pattern': c => null,
          pattern: (c, state) => {
            // run sub-machine
            state.pattern = state.pattern || ''
            return 'pattern';
          },
        },
      )

      /**
       * A blank line matches no files, so it can serve as a separator for readability.
       */
      if (line === '') return

      /**
       * A line starting with # serves as a comment. Put a backslash ("\") in front of the first hash for patterns that begin with a hash.
       */
      if (line[0] === '#') return

      /**
       * Trailing spaces are ignored unless they are quoted with backslash ("\").
       */

      /**
       * An optional prefix "!" which negates the pattern;
       * any matching file excluded by a previous pattern will become included again.
       * It is not possible to re-include a file if a parent directory of that file is excluded.
       * Git doesn’t list excluded directories for performance reasons,
       * so any patterns on contained files have no effect, no matter where they are defined.
       * Put a backslash ("\") in front of the first "!" for patterns that begin with a literal "!", for example, "\!important!.txt".
       */
      const negative = line[0] === '!'

      /**
       * The slash / is used as the directory separator. Separators may occur at the beginning, middle or end of the `.gitignore` search pattern.
       *
       * If there is a separator at the beginning or middle (or both) of the pattern,
       * then the pattern is relative to the directory level of the particular `.gitignore` file itself.
       * Otherwise the pattern may also match at any level below the `.gitignore` level.
       * If there is a separator at the end of the pattern then the pattern will only match directories,
       * otherwise the pattern can match both files and directories.
       * For example, a pattern `doc/frotz/` matches `doc/frotz` directory, but not `a/doc/frotz` directory;
       * however `frotz/` matches `frotz` and `a/frotz` that is a directory (all paths are relative from the `.gitignore` file).
       */

      /**
       * An asterisk "*" matches anything except a slash.
       * The character "?" matches any one character except "/".
       * The range notation, e.g. [a-zA-Z], can be used to match one of the characters in a range.
       * See fnmatch(3) and the FNM_PATHNAME flag for a more detailed description.
       */


      // Two consecutive asterisks ("**") in patterns matched against full pathname may have special meaning:
      // A leading "**" followed by a slash means match in all directories. For example, "**/foo" matches file or directory "foo" anywhere, the same as pattern "foo". "**/foo/bar" matches file or directory "bar" anywhere that is directly under directory "foo".
      // A trailing "/**" matches everything inside. For example, "abc/**" matches all files inside directory "abc", relative to the location of the .gitignore file, with infinite depth.
      // A slash followed by two consecutive asterisks then a slash matches zero or more directories. For example, "a/**/b" matches "a/b", "a/x/b", "a/x/y/b" and so on.
      // Other consecutive asterisks are considered regular asterisks and will match according to the previous rules.

      // find `linguist-generated=true` and guarantee no `linguist-generated=false` after it
    })
}
