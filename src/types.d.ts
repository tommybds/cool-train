import { WebGLRenderer } from 'three'

declare module 'three' {
  interface WebGLRendererParameters {
    userData?: {
      forward?: boolean
      backward?: boolean
    }
  }
}