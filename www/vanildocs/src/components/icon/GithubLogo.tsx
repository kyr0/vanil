import { fetchContent, IVirtualNode } from "vanil"
import { setCubicVdomNodeSize } from "../../function/setCubicVdomNodeSize"

const githubLogo: IVirtualNode = fetchContent('../../../public/assets/icons/github-logo.svg')[0]
setCubicVdomNodeSize(30, githubLogo)

export const GithubLogo = () => githubLogo