import prettier from 'prettier'

export const prettify = (code: string) => {
  try {
    return prettier.format(code, {
      parser: 'html',
      arrowParens: 'always',
      bracketSameLine: true,
      bracketSpacing: true,
      embeddedLanguageFormatting: 'auto',
      htmlWhitespaceSensitivity: 'css',
      insertPragma: false,
      jsxSingleQuote: false,
      proseWrap: 'preserve',
      quoteProps: 'as-needed',
      requirePragma: false,
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      useTabs: false,
      vueIndentScriptAndStyle: false,
      printWidth: 120,
    })
  } catch (e) {}
  return code
}
