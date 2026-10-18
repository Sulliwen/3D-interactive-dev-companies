import { defineScreen } from '../types'
import { AudioMixerScreen } from './AudioMixerScreen'
import { AUDIO_MIXER_ZONES, audioMixerPropsSchema } from './schema'

export const screen = defineScreen({
  component: AudioMixerScreen,
  props: audioMixerPropsSchema,
  zones: () => [...AUDIO_MIXER_ZONES],
})
