/** Shared feature + shortcut catalog for README parity and the in-app Help panel.
 *  Source of truth: `features.json`. After editing it, run `npm run sync:readme`.
 */
import catalog from './features.json'

export type FeatureEntry = {
  name: string
  shortcut?: string
  note?: string
}

export type FeatureSection = {
  title: string
  items: FeatureEntry[]
}

export const FEATURE_SECTIONS: FeatureSection[] = catalog as FeatureSection[]
