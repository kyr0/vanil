import { createSignal } from "solid-js";
import { renderPage, getContext, Title } from "../../../../dist/runtime"
import { Page } from "../../layout/Page";
import VanilLogo from "../../../../resources/vanil-logo.svg"
import TestHtml from "../../../data/test.html"

interface Params {
  id: string
}

interface Props {
  id: string
}

export async function getStaticPaths() {

  return {
    paths: [{ params: { id: '1' } as Params }, { params: { id: '2' } as Params }],
    fallback: false, // can also be true or 'blocking'
  }
}

// `getStaticPaths` requires using `getStaticProps`
export async function getStaticProps(params: Params) {
  console.log('getStaticProps params', params)
  const id = params.id
  
  return {
    // Passed to the page component as props
    props: { id }
  }
}

function Post({ props, params, env } = getContext<Props>()) {

  const [clickCount, setClickCount] = createSignal(parseInt(props.id, 10));

  function handleMouseClick(event: MouseEvent) {
    console.log('clicked1', event)
    setClickCount(clickCount() + 1)
  }
  /*
  if (isServer) {
    console.log('isServer')
  } else {
    console.log('isClient')
  }
  */
  //console.log('params', params)
  //console.log('context', getContext())

  return (
    <Page>
        <Title>{"id title " + props.id}</Title>
        <VanilLogo />
        <TestHtml />
        <div>id page: {props.id}</div>
        <button onClick={handleMouseClick}>Click me</button>
        <div>Clicked: {clickCount()}</div>
       
        <script>
          console.log('test1 index')
        </script>
    </Page>
  )
}

export default renderPage(Post)