import { defineConfig } from 'vitepress'

const repo = 'https://github.com/nfbs2000/speaky-CopilotKit'
const analyzedCommit = '5c50d9c51'
const siteBaseUrl = 'https://nfbs2000.github.io/speaky-CopilotKit/'
const defaultDescription =
  'speaky-CopilotKit 리포를 현재 트리 그대로 읽기 위한 한국어 GitHub Pages'

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

function pageUrl(relativePath: string): string {
  const cleanPath = relativePath
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '')
    .replace(/^\/+/, '')

  return new URL(cleanPath, siteBaseUrl).toString()
}

export default defineConfig({
  base: '/speaky-CopilotKit/',
  lang: 'ko-KR',
  title: 'CopilotKit Repository Notes',
  description: defaultDescription,
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: siteBaseUrl,
  },
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'CopilotKit Source Notes' }],
    ['meta', { property: 'og:locale', content: 'ko_KR' }],
    ['meta', { name: 'robots', content: 'index,follow' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
  ],
  transformPageData(pageData) {
    const url = pageUrl(pageData.relativePath)
    const title =
      pageData.relativePath === 'index.md'
        ? 'CopilotKit Repository Notes'
        : `${pageData.title} | CopilotKit Repository Notes`
    const description = pageData.description || pageData.frontmatter.description || defaultDescription
    const modified =
      typeof pageData.lastUpdated === 'number'
        ? new Date(pageData.lastUpdated).toISOString()
        : undefined

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': pageData.relativePath === 'index.md' ? 'WebSite' : 'TechArticle',
      name: title,
      headline: pageData.title || 'CopilotKit Source Notes',
      description,
      url,
      inLanguage: 'ko-KR',
      isPartOf: {
        '@type': 'WebSite',
        name: 'CopilotKit Repository Notes',
        url: siteBaseUrl,
      },
      author: {
        '@type': 'Person',
        name: 'nfbs2000',
      },
      about: [
        'CopilotKit',
        'AG-UI',
        'A2UI',
        'frontend tools',
        'Nx monorepo',
        'agent skills',
        'showcase platform',
        'Sim Mothership',
        'agent runtime',
      ],
      mainEntityOfPage: url,
      ...(modified ? { dateModified: modified } : {}),
    }

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(structuredData)]
    )
  },
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
    siteTitle: 'CopilotKit Repo',
    outline: {
      level: [2, 3],
      label: '이 페이지',
    },
    nav: [
      { text: '리포 개요', link: '/' },
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
      message: 'nfbs2000/speaky-CopilotKit repository notes.',
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
