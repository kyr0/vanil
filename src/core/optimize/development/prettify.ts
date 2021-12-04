const prettier = require("prettier");

export const prettify = (code: string) => {
    return prettier.format(code, {
        "parser": "html",
        "arrowParens": "always",
        "bracketSameLine": false,
        "bracketSpacing": true,
        "embeddedLanguageFormatting": "auto",
        "htmlWhitespaceSensitivity": "css",
        "insertPragma": false,
        "jsxSingleQuote": false,
        "proseWrap": "preserve",
        "quoteProps": "as-needed",
        "requirePragma": false,
        "semi": false,
        "singleQuote": true,
        "tabWidth": 2,
        "trailingComma": "es5",
        "useTabs": false,
        "vueIndentScriptAndStyle": false,
        "printWidth": 120
    })
}