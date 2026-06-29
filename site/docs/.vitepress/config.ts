import { defineConfig } from 'vitepress'

const repo = 'https://github.com/nfbs2000/speaky-CopilotKit'
const analyzedCommit = '5c50d9c51'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[char] ?? char
  })
}

export default defineConfig({
  base: '/speaky-CopilotKit/',
  lang: 'ko-KR',
  title: 'CopilotKit Source Notes',
  description:
    'speaky-CopilotKit source를 기준으로 CopilotKit의 runtime, AG-UI, frontend tool, generative UI 경계를 설명하는 한국어 문서',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'CopilotKit Source Notes' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'CopilotKit을 챗봇 UI가 아니라 agent-native application runtime으로 읽는 source-backed 한국어 문서',
      },
    ],
  ],
  markdown: {
    config(md) {
      const defaultFence = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const info = token.info.trim().split(/\s+/)[0]
        if (info === 'mermaid') {
          return `<pre class="mermaid">${escapeHtml(token.content)}</pre>`
        }
        return defaultFence?.(tokens, idx, options, env, self) ?? ''
      }
    },
  },
  themeConfig: {
    siteTitle: 'CopilotKit Source',
    outline: {
      level: [2, 3],
      label: '이 페이지',
    },
    nav: [
      { text: '개요', link: '/' },
      { text: 'Source Notes', link: '/copilotkit-source/01-introduction' },
      { text: 'GitHub', link: repo },
    ],
    sidebar: {
      '/copilotkit-source/': [
        {
          text: 'CopilotKit Source Notes',
          items: [
            { text: '1. 소개', link: '/copilotkit-source/01-introduction' },
            { text: '2. Monorepo 지도', link: '/copilotkit-source/02-monorepo-map' },
            { text: '3. 통제 경계', link: '/copilotkit-source/03-control-boundary' },
            {
              text: '4. Core와 Runtime 코드 경로',
              link: '/copilotkit-source/04-core-runtime-codepath',
            },
            {
              text: '5. AG-UI 이벤트 모델',
              link: '/copilotkit-source/05-ag-ui-event-model',
            },
            {
              text: '6. UI Tools와 A2UI',
              link: '/copilotkit-source/06-ui-tools-a2ui-rendering',
            },
            {
              text: '7. Mothership 적용 설계',
              link: '/copilotkit-source/07-mothership-application-layer',
            },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    socialLinks: [{ icon: 'github', link: repo }],
    footer: {
      message: 'nfbs2000/speaky-CopilotKit source reading notes.',
      copyright: `Source snapshot: ${analyzedCommit}`,
    },
    editLink: {
      pattern: `${repo}/edit/codex/copilotkit-source-pages/site/docs/:path`,
      text: '이 문서 수정하기',
    },
    lastUpdated: {
      text: '마지막 업데이트',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },
  },
})
