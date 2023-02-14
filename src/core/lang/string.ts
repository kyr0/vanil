/** capitalizes the first letter of the token and appends the rest: foo -> Foo */
export const ucfirst = (token: string) => token[0].toUpperCase() + token.substring(1).toLowerCase()
