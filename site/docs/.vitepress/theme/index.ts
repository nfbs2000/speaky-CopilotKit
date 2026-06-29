import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { defineComponent, h, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import './style.css'

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
            node.innerHTML = svg
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
