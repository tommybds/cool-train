import { WebGLRenderer } from 'three'

declare module 'three' {
  interface WebGLRenderer {
    userData: {
      forward?: boolean
      backward?: boolean
    }
  }
}