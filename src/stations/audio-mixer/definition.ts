import { defineScreen } from '../types'
import { AudioMixerScreen } from './AudioMixerScreen'
import { AUDIO_MIXER_ACCESSIBILITY_ZONES, AUDIO_MIXER_ZONES, audioMixerPropsSchema } from './schema'

export const screen = defineScreen({
  component: AudioMixerScreen,
  props: audioMixerPropsSchema,
  zones: (props) => [
    ...AUDIO_MIXER_ZONES,
    ...(props.accessibility ? AUDIO_MIXER_ACCESSIBILITY_ZONES : []),
  ],
})
