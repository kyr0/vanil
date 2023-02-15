# VAML

Vanil HTML (VAML) is vanilla HTML plus a few components to give developers, designers and content creators the
ability to add control logic to markup with easy and simplicity. To do so, Vanil provides a fully isomorphic renderer, runtime context and DOM enhancements.

## Motivation

When I started out in the early 00s, I only had to learn CSS3, XHTML, a bit of pre-ES6 JavaScript that couldn't even import nor require. In fact, and in hindsight, it was rather easy. I was able to implement
decent websites by simply using a bit of PHP as well. In PHP, an HTTP request
would be processed by a webserver like Apache, handed over to the PHP, which would execute the developer-provided code to decide on which HTML markup would be rendered with content and sent back to the client (the browser).

Nowadays, we see the very same concept with `SSR` rendering using various syntaxes, libraries, frameworks and execution environments. But watching the industry going forward, I understand that the complexity just escalated.
Modern web development has become much too complex. To build a simple multi-lingual website with user authentication, you soon need a master in computer science, while essentially, it's just a few if's and else's
that would be required if there wasn't a framework fatigue.

Imagine, there would be every 2 years a new HTML standard that would do things totally differently.
Wouldn't that sound crazy? It would. Yet we do the same thing with the abstractions that we build upon
web standards. This is not only burning a huge pile of money, it's also eating up our lifetimes, the efficiency
of departments, companies and arguably, even heats up the planet by adding a ton of extra computation time that is wasted with every single request that is made.

The idea of Vanil is to come up with a concept and an HTML specification proposal, plus a proof-of-concept implementation to get us bring us back, closer to sanity. To allow us to use web standards in the way that a lot
of people students I was talking to, expected HTML to work, when they first learned about it.

Here is an example:

> index.html

```jsx
<html lang="de">
  <head>
    <title>A sane tech-stack</title>
  </head>
  <body>
    <Only if={user.isGuest}>
      <Link to="/signup">Sign up here</Link>
    </Only>
  </body>
</html>
```

### Multi-lingual documents

Now imagine, that every `#text` node is a translation key. Before constructing the actual
DOM, the DOM implementation will look-up the translation text for the key `A sane tech-stack`
in language `german` (`de`). The same method is applied to HTML attributes that hold user-focused
text such as `aria-label`, `alt`, `content` etc. pp.

There is no need to provide a translation though. In this case,
the key will be displayed. Translations can be provided in various ways but the default method
is a `TSV` file next to the HTML file:

> index.translations.tsv

```csv
de  A sane tech-stack   Ein gescheiter Tech-Stack
en  A sane tech-stack   A sane tech-stack
```

Translation keys instead of default text can also be used. The implementation simply matches text.

The `<only>` element allows to render markup only if the JavaScript function that is given
in the `if` condition, returns a truthy value. Here, a developer can use meaningful context values
that are informing the control logic about various standard use-cases, such as the authentication
status of a user. It is just standard, modern JavaScript, though.

The `<link>` element, for example, eventually renders a standard `a` tag, but the `href`
attribute is dynamically evaluated based on the language of the HTML document. Much like the
`#text` nodes, the target hyperlink values can be provided in various ways but the default
method is, again, a `TSV` file next to the HTML file:

```csv
de  /signup   /jetzt-anmelden
en  /signup   /sign-up
```

### Rendering on the server-side (SSR, SSG)

Now you may think that this is way to static. You may not want to write static files
to disk in order to render a VHTML file on server-side when doing server-side rendering
in a serverless function.

As said before, there are various ways to accomplish the rendering of VHTML:

```tsx
import { render } from 'vanil'

// you may load this from any data-source
const translations = {
  de: { 'A sane tech-stack': 'Ein gescheiter Tech-Stack' },
  en: { 'A sane tech-stack': 'A sane tech-stack' },
}

const links = {
  de: { '/signup': '/jetzt-anmelden' },
  en: { '/signup': '/sign-up' },
}

// render VHTML to HTML
const HTML = render(
  () => (
    <html lang="de">
      <head>
        <title>A sane tech-stack</title>
      </head>
      <body>
        <Only if={user.isGuest}>
          <Link to="/signup">Sign up here</Link>
        </Only>
      </body>
    </html>
  ),
  {
    translations,
    links,
  },
)
```

### Rendering in a `<script>` at runtime (client-side)

But what if you may want to use the same VHTML dynamic markup on client-side?
Wouldn't it be solving a lot of issues, namely, vaporize the necessity to have
client-side JavaScript libraries to render HTML?

This is, why VHTML is fully isomorphic. Feel free to do things like this:

> on server-side

```astro
<html lang="de">
  <head>
    <title>A sane tech-stack</title>
  </head>
  <body>
    <Only if={user.isGuest}>
      <Link to="/signup">Sign up here</Link>
    </Only>
    <div id="portal"></div>
    <script>
      // executed on client-side, the same way
      if (user.isAdmin)  {
        update('#portal', <div>Welcome back, {user.name}!</div>)
      }
    </script>
  </body>
</html>
```

And of course, you don't need to care for translations and links on client-side,
as they are available as `globalThis.translations` and `globalThis.links` automatically.

### Loops

Along the lines of `<Only>` and `<Link>` you may want to dynamically render VHTML
that has been provided via various data-sources such as an API request on client-side
or via a database resource or files on server-side.

This use-case often goes along with repeating the rendering of parts of the markup
of a specific section of a page. This is possible using the `For` and `Render`
components:

```tsx
<For each={context.blogPosts}>
  {(blogPost, i) => (
    <section>
      <h3>
        {i}
        {i > 1 ? 'nd' : 'st'} post: {blogPost.title}
      </h3>
      <h4 class="author">{blogPost.author}</h4>
      <Render vhtml={blogPost.articleVhtml} options={{ translations, links, user, context }} />
    </section>
  )}
</For>
```

The `For` component takes data as either an `Array` or an `Object` for its `each` property.
In case of an Array, the loop happens over its numeric indexes, otherwise it loops over
the own keys of the object and treats the names of the keys as indexes. For each item,
the function passed as children is called to render VHTML.

The `Render` component however will gladly take any VHTML by reference and render it,
just as the `render()` function would do.

### How to resolve the `user` and `context` globals?

VHTML is a frontend markup specification. Determining application-level data is therefore
out of scope, but here is, how Vanil, the reference implementation of the specification,
handles it:

- by default, the `user` object is initialized as:

```ts
{
  isGuest: true,
  roles: merge(["guest"], { guest: true }), // user.roles.guest === true && user.roles[0] === "guest"
  isLoggedIn: false,
  data: {}
}
```

- by default, the `context` object is initialized as: `{}`

These default can be overridden by calling `render()` on server-side or client-side or even by providing
the `options` attribute to the `Render` component:

```tsx
render((
  <html>...</html>
), {
  user: { ... },
  context: { ... },
  translations: { ... },
  links: { ... }
})
```

Naturally, the code to resolve this state would be implemented before the rendering logic is invoked,
meaning the handler function in an SSR/serverless function environment, the orchestrator in an SSG renderer
or, in best case, in the pre-rendering phase of a browser, if browsers would ever implement this spec.

For Vanil, the reference implementation, you can simple define a file named the same like the VHTML file,
and export the respective objects there:

> index.html

```astro
<html>
 ...
</html>
```

> index.tsx

```tsx
export const user = { ... }
export const context = { ... }
export const translations = { ... }
export const links = { ... }
```

Please consult the Vanil API docs for futher information as Vanil comes with a vast isomorphic API for
materializing dynamic routes, pagination, data loading, various data format rendering and
authentification that goes far beyond the markup rendering specification discussed here.

## API

<table>
  <thead>
    <td><strong>Name</strong></td>
    <td><strong>Type</strong></td>
    <td><strong>Description</strong></td>
  </thead>
  <tr>
    <td><pre>render<pre></td>
    <td><pre>(vhtml: () => VNode, options: { translations, links, user, context } ) => Element<pre></td>
    <td>Renders VHTML virtual node (JSX) into a DOM tree</td>
  </tr>
  <tr>
    <td><pre>renderToString<pre></td>
    <td><pre>(el: Element) => string<pre></td>
    <td>Renders a DOM tree into a HTML string (for SSR purposes)</td>
  </tr>
  <tr>
    <td><pre>update<pre></td>
    <td><pre>(el: Element, vhtml: VNode) => Element<pre></td>
    <td>Differentially updates a referenced subtree of a DOM element to match the VHTML provided</td>
  </tr>
  <tr>
    <td><pre>translations<pre></td>
    <td><pre>{ [locale: string]: { [key: string]: string } }<pre></td>
    <td>2D map that partially holds the translations of text used in the document</td>
  </tr>
  <tr>
    <td><pre>links<pre></td>
    <td><pre>{ [locale: string]: { [key: string]: string } }<pre></td>
    <td>2D map that partially holds the alternative language links used in the document</td>
  </tr>
  <tr>
    <td><pre>user<pre></td>
    <td><pre>{ isGuest: boolean, roles: Array&lg;string&gt; & { [roleName: string]: boolean }, isLoggedIn: boolean, data: { [key: string]: any } }<pre></td>
    <td>Map that holds information about the user interfacing with the document</td>
  </tr>
  <tr>
    <td><pre>Only<pre></td>
    <td><pre>({ if: boolean }) => VNode<pre></td>
    <td>Functional component that allows conditional rendering of elements</td>
  </tr>
  <tr>
    <td><pre>For<pre></td>
    <td><pre>({ each: Array&lt;T&gt;, children: (item: T, index: number|string) => Array&lg;VNode&gt; }) => Array&lg;VNode&gt;<pre></td>
    <td>Functional component that allows repeated rendering of elements</td>
  </tr>
  <tr>
    <td><pre>Link<pre></td>
    <td><pre>({ to: string }) => VNode</td>
    <td>Functional component that allows conditional href rendering for anchors</td>
  </tr>
  <tr>
    <td><pre>Render<pre></td>
    <td><pre>({ vhtml: VNode, options: { translations, links, user, context } }) => VNode</td>
    <td>Functional component to render VHTML directly, just as render() would do</td>
  </tr>
</table>
