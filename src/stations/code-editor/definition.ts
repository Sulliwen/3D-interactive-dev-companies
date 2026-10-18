import { getCodeSource } from '../../content/loader'
import { defineScreen } from '../types'
import { CodeEditorScreen } from './CodeEditorScreen'
import { CODE_EDITOR_FIXED_ZONES, CODE_EDITOR_PREVIEW_ZONE, codeEditorPropsSchema } from './schema'

export const screen = defineScreen({
  component: CodeEditorScreen,
  props: codeEditorPropsSchema,
  zones: (props) => [
    ...CODE_EDITOR_FIXED_ZONES,
    ...(props.preview ? [CODE_EDITOR_PREVIEW_ZONE] : []),
    ...props.files.flatMap((f) => getCodeSource(f.source)?.zones.map((z) => z.id) ?? []),
  ],
})
