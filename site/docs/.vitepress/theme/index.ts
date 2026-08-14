import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { defineComponent, h, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import './style.css'

let activeMermaidClose: (() => void) | null = null

const closeActiveMermaidZoom = () => {
  activeMermaidClose?.()
  activeMermaidClose = null
}

const getSvgBaseWidth = (svg: SVGSVGElement) => {
  const viewBox = svg
    .getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value))

  if (viewBox?.length === 4 && Number.isFinite(viewBox[2]) && viewBox[2] > 0) {
    return viewBox[2]
  }

  const width = Number.parseFloat(svg.getAttribute('width') ?? '')
  if (Number.isFinite(width) && width > 0) return width

  const rect = svg.getBoundingClientRect()
  return rect.width > 0 ? rect.width : 1200
}

const makeButton = (label: string, ariaLabel: string) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.setAttribute('aria-label', ariaLabel)
  return button
}

const openMermaidZoom = (sourceNode: HTMLElement) => {
  const originalSvg = sourceNode.querySelector<SVGSVGElement>('svg')
  if (!originalSvg) return

  closeActiveMermaidZoom()

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const overlay = document.createElement('div')
  overlay.className = 'mermaid-zoom'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', 'Mermaid diagram zoom')

  const toolbar = document.createElement('div')
  toolbar.className = 'mermaid-zoom__toolbar'

  const title = document.createElement('div')
  title.className = 'mermaid-zoom__title'
  title.textContent = 'Mermaid diagram'

  const zoomOut = makeButton('-', 'Zoom out')
  const zoomReset = makeButton('100%', 'Reset zoom')
  const zoomIn = makeButton('+', 'Zoom in')
  const closeButton = makeButton('닫기', 'Close zoom')

  toolbar.append(title, zoomOut, zoomReset, zoomIn, closeButton)

  const viewport = document.createElement('div')
  viewport.className = 'mermaid-zoom__viewport'

  const figure = document.createElement('div')
  figure.className = 'mermaid-zoom__figure'

  const clone = originalSvg.cloneNode(true) as SVGSVGElement
  clone.classList.add('mermaid-zoom__svg')
  clone.removeAttribute('style')

  figure.append(clone)
  viewport.append(figure)
  overlay.append(toolbar, viewport)

  const baseWidth = getSvgBaseWidth(originalSvg)
  let zoom = 1

  const setZoom = (nextZoom: number) => {
    zoom = Math.min(4, Math.max(0.5, nextZoom))
    clone.style.width = `${Math.round(baseWidth * zoom)}px`
    clone.style.maxWidth = 'none'
    clone.style.height = 'auto'
    zoomReset.textContent = `${Math.round(zoom * 100)}%`
  }

  const closeZoom = () => {
    overlay.remove()
    document.body.classList.remove('mermaid-zoom-open')
    document.removeEventListener('keydown', handleKeydown)
    activeMermaidClose = null
    previousFocus?.focus()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeZoom()
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      setZoom(zoom + 0.25)
    }
    if (event.key === '-') {
      event.preventDefault()
      setZoom(zoom - 0.25)
    }
    if (event.key === '0') {
      event.preventDefault()
      setZoom(1)
    }
  }

  zoomOut.addEventListener('click', () => setZoom(zoom - 0.25))
  zoomReset.addEventListener('click', () => setZoom(1))
  zoomIn.addEventListener('click', () => setZoom(zoom + 0.25))
  closeButton.addEventListener('click', closeZoom)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeZoom()
  })

  document.body.append(overlay)
  document.body.classList.add('mermaid-zoom-open')
  document.addEventListener('keydown', handleKeydown)
  activeMermaidClose = closeZoom
  setZoom(1)
  closeButton.focus()
}

const MermaidRenderer = defineComponent({
  name: 'MermaidRenderer',
  setup() {
    const route = useRoute()

    const renderMermaid = async () => {
      if (typeof window === 'undefined') return

      await nextTick()

      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('.mermaid:not([data-rendered="true"])')
      )

      if (nodes.length === 0) return

      const mermaid = (await import('mermaid')).default
      const isDark = document.documentElement.classList.contains('dark')

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: isDark ? 'dark' : 'default',
      })

      await Promise.all(
        nodes.map(async (node, index) => {
          const source = node.textContent ?? ''
          const id = `mermaid-${route.path.replace(/[^a-zA-Z0-9_-]/g, '-')}-${index}-${Math.random()
            .toString(36)
            .slice(2)}`

          try {
            const { svg, bindFunctions } = await mermaid.render(id, source)
            node.innerHTML = ''
            node.classList.add('mermaid--rendered')

            const zoomButton = makeButton('크게 보기', 'Open Mermaid diagram zoom')
            zoomButton.className = 'mermaid__zoom-button'

            const canvas = document.createElement('div')
            canvas.className = 'mermaid__canvas'
            canvas.innerHTML = svg
            canvas.title = 'Click to enlarge diagram'

            zoomButton.addEventListener('click', () => openMermaidZoom(node))
            canvas.addEventListener('click', () => openMermaidZoom(node))

            node.append(zoomButton, canvas)
            node.dataset.rendered = 'true'
            bindFunctions?.(node)
          } catch (error) {
            node.dataset.rendered = 'error'
            console.error('Mermaid render failed', error)
          }
        })
      )
    }

    onMounted(renderMermaid)
    watch(
      () => route.path,
      () => {
        closeActiveMermaidZoom()
        window.setTimeout(renderMermaid, 0)
      }
    )

    return () => null
  },
})

const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(MermaidRenderer),
    })
  },
}

export default theme
