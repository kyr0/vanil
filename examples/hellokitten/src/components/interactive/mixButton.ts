import { on, $, render, refs, emit } from 'vanil';

export const mixButtonHandler = (evt: MouseEvent) => {
  console.log('mixButtonHandler', evt);

  emit('transactionComplete', {
    mixIt: Date.now(),
  });

  $(refs.mixBtn2).update('Just wow!');
};
