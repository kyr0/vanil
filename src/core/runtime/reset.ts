/** resets runtime states to a meaningful default for all states that must be page-isolated  */
export const resetVanilPageIsolatedRuntimeState = () => {
  // every page render should start with a default language setting
  Vanil.language = 'en'
}
