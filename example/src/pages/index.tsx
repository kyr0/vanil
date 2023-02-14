import { createEffect, createSignal, ErrorBoundary } from "solid-js";
import { isServer as x } from "solid-js/web";
import { Page } from "../layout/Page";
import {
  getContext,
  renderPage,
  loadFile,
  publishFile,
  glob,
  getServerContext,
  ComponentWithChildren,
  Title,
} from "../../../dist/runtime";
import Lala from "./lala.mdx";
import { MyData } from "../../scripts/prepareData";
import classes from "./index.css";
import { createMutable } from "solid-js/store";

// Pure Solid.js based issues:
// TODO: support nonInteractive mode: remove all data-hk, also data-sm
// TODO: fork and include Solid.js into this codebase and fix it for
// TODO: client <ErrorBoundary> doesn't catch async errors
// TODO: "Unknown Error" because of castError
// TODO: No reactivity with <></> JSX syntax
// TODO: test encoding HTML client/server sending

// ---

// TODO: config callback for esbuild client/server options
// TODO: image optimization / sharp
// TODO: try client side routing
// TODO: SSR locally, and with serverless API routes for Vercel, Netlify, Firebase
// TODO: performance: build cache, code cache, bundle cache etc.

interface Props {
  product: {
    id: number;
    title: string;
    description: string;
    price: number;
    thumbnail: string;
  };
  img: string;
  html: string;
  cssFile: string;
}

// `getStaticPaths` requires using `getStaticProps`
export async function getStaticProps() {
  const testHTML = await loadFile("../../data/test.html");

  console.log("testHTML", testHTML);

  const someProduct = {
    foo: "asd",
    id: 123,
    title: "asd",
    description: "asd",
    price: 1231.123,
    thumbnail: "asd",
  }; //await (await fetch(`https://dummyjson.com/products/1`)).json();

  console.log("someProduct", someProduct);

  // TODO: async would be better1
  const urlToTestJson = publishFile("../../data/test.json");
  console.log("urlToTestJson", urlToTestJson);

  getServerContext<MyData>().store;

  const allJsons = glob("../../data/*.json");
  console.log("allJsons", allJsons);

  const cssFile = await loadFile("../../data/test.css");
  console.log("cssFile", cssFile);

  const faviconBase64 = await loadFile<string>("base64:../../data/test.png");
  const json = await loadFile<string>("../../data/test.json");

  someProduct.foo = (_context.store as any).foo;

  return {
    //nonInteractive: true,
    // Passed to the page component as props
    props: {
      product: someProduct,
      img: faviconBase64,
      html: testHTML,
      cssFile,
    } as Props,
  };
}

const MyFunnyH2: ComponentWithChildren = (props) => {
  console.log("modifying how a h2 is rendered in mdx", props);
  return <h2>Mein header: {props.children}</h2>;
};

const TestErrorBoundary = ({}) => {
  // TODO: isServer as part of useContext() ???
  //throw new Error('boom!')
  return <div>isClient</div>;
};

const effective =
  (fn): any =>
  (props) => {
    const [res, setRes] = createSignal();
    createEffect(() => {
      setRes(fn(props));
    });
    return res();
  };

function useStore<T>(value: T) {
  const x = createMutable<T>(value);

  return x;
}

const Decide = (props) => {
  return <div>{props.if ? props.children : props.else()}</div>;
};

const Index = ({ props, mode, styles } = getContext<Props>()) => {
  console.log("Index product", props.product.description);
  console.log("styles?!", styles[0]);
  const [nodeEnv, setNodeEnv] = createSignal(mode);

  const [_isServer, _setIsServer] = createSignal(isServer);
  const [goose, setGoose] = createSignal("goose");

  //_setIsServer(false)

  console.log("x", x);

  if (!_isServer()) {
    console.log("on the client!");
  }
  console.log("TestErrorBoundary isServer11", _isServer());

  if (isServer) {
    //console.log('only SSG/SSR', getContext(), nodeEnv())
  } else {
    console.log("only CSR", getContext(), nodeEnv());
  }
  const [clickCount, setClickCount] = createSignal(2);

  function handleMouseClick(event: MouseEvent) {
    console.log("clicked", event);
    setClickCount(clickCount() + 1);
    _setIsServer(true);
    setGoose("foose");
  }

  // only runs on server
  if (isServer) {
    publishFile("../../data/test.json");
  }

  return (
    <Page>
      <ErrorBoundary
        fallback={(err, reset) => (
          <div onClick={reset}>Boundary: {err.toString()}</div>
        )}
      >
        <Title>index title</Title>
        <div>{goose()}</div>
        <div>
          {() => {
            console.log("re-evaluate?");
            if (typeof document !== "undefined") {
              console.log("toller ErrorBoundary");
            }
            return <div>lol</div>;
          }}
        </div>
        <img src={`data:image/png;base64,${props.img}`}></img>
        <div class={classes.goo}>index page</div>
        <style>{props.cssFile}</style>

        <Lala components={{ h2: MyFunnyH2 }} />
        <div innerHTML={props.html} />
        <button onClick={handleMouseClick}>Click me1</button>
        <div>Clicked: {clickCount()}</div>
        <Decide if={_isServer()} else={() => <TestErrorBoundary />}>
          <div>isServer</div>
        </Decide>
        <script>console.log('test1 index')</script>
      </ErrorBoundary>
    </Page>
  );
};
export default renderPage(Index);
