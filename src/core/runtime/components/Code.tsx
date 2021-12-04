export interface CodeProps {
    code: string
    lang: string
    theme: string
    wrap: boolean
}

/**  */
export const Code = ({ code, lang, theme, wrap }: CodeProps) => {

    const wrapStyle: any = wrap ? {
        whiteSpace: 'normal',
        wordBreak: 'break-word'
    } : {}

    return <>
        <Vanil.Link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/themes/prism.min.css" />
        {theme && <Vanil.Link href={`https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/themes/prism-${theme}.min.css`} />}

        <Vanil.Script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/prism.min.js" />
        <Vanil.Script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/plugins/autoloader/prism-autoloader.min.js" />

        <pre style={wrapStyle}>
            <code class={`language-${lang}`} style={wrapStyle}>
                { code }
            </code>
        </pre>
        <Vanil.Script>
            Prism.highlightAll()
        </Vanil.Script>
    </> 
}

Vanil.Code = Code