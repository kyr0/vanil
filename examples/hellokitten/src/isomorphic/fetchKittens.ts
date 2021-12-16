import { fetch } from 'vanil'

export const fetchKittens = async () => (await fetch('https://cataas.com/api/cats?skip=0&limit=5')).json()
