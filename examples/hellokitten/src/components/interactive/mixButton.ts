import { $, refs, emit } from 'vanil'

export const mixButtonHandler = (evt: MouseEvent) => {
  console.log('mixButtonHandler', evt)

  emit('transactionComplete', {
    mixIt: Date.now(),
  })

  console.log('refs.mixBtn2', refs.mixBtn2)
  $(refs.mixBtn2).update('Just wow!')
}
