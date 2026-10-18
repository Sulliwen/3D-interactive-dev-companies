import type { WebGLRenderer } from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

let ktx2: KTX2Loader | null = null

/** Un seul décodeur KTX2 (et ses workers) pour tout le jeu. */
export function getKtx2(gl: WebGLRenderer): KTX2Loader {
  ktx2 ??= new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/`).detectSupport(gl)
  return ktx2
}

/**
 * Extension pour `useGLTF` de drei (qui s'appuie sur le GLTFLoader de three-stdlib,
 * compatible avec celui de three) : textures KTX2.
 */
export const withKtx2 = (gl: WebGLRenderer) => (loader: unknown) =>
  (loader as GLTFLoader).setKTX2Loader(getKtx2(gl))
