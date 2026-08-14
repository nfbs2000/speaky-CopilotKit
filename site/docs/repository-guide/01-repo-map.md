---
title: 1. 리포 지도
description: speaky-CopilotKit GitHub repository의 큰 영역과 읽는 순서를 정리합니다.
---

# 1. 리포 지도

[`nfbs2000/speaky-CopilotKit`](https://github.com/nfbs2000/speaky-CopilotKit)는 하나의 앱이 아니라 CopilotKit 제품 코드, SDK, runtime, platform adapter, examples, showcase 운영 도구, docs, AI coding agent skills가 같이 들어 있는 Nx/pnpm monorepo다.

## 한 문장으로

CopilotKit은 frontend UI와 server runtime과 agent framework를 AG-UI event stream으로 연결해서, 앱 안의 chat, tool rendering, shared state, human-in-the-loop, generative UI를 만들게 하는 agent-native application framework다.

이 repository는 그 framework를 여러 surface에서 실제로 빌드하고, 여러 agent framework와 붙이고, examples/showcase로 검증하고, coding agent가 안전하게 수정하도록 운영 문서와 skills까지 포함한다.

## 큰 디렉터리

| 경로 | 역할 |
| --- | --- |
| [`README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/README.md) | 제품 관점의 공개 소개. CopilotKit을 agent-native application framework로 설명한다. |
| [`package.json`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/package.json) | monorepo 공통 스크립트. Nx build/test/typecheck, examples build, docs, plugin skills sync, parity check가 여기에 모인다. |
| [`pnpm-workspace.yaml`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/pnpm-workspace.yaml) | workspace에 포함되는 package/example/showcase 범위를 정한다. |
| [`nx.json`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/nx.json) | build/test/check-types target, cache 입력, parallelism, default base를 정의한다. |
| [`packages/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages) | 배포 단위인 `@copilotkit/*` library와 adapter가 들어 있다. |
| [`sdk-python/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/sdk-python) | Python SDK와 LangGraph/AG-UI 관련 테스트가 있다. |
| [`examples/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/examples) | starter, canvas app, showcase app을 모은 예제 영역이다. |
| [`showcase/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/showcase) | framework별 demo fleet, shell, shell-docs, harness, Railway 운영 도구가 있는 별도 platform이다. |
| [`skills/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills) | coding agent가 CopilotKit 작업을 할 때 읽는 `SKILL.md` 지침이다. |
| [`.claude/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/.claude) | 이 repository에서 agent가 따라야 하는 architecture, documentation, git, workflow 규칙이다. |
| [`dev-docs/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/dev-docs) | architecture와 setup을 설명하는 개발자 문서다. |
| [`.github/workflows/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/.github/workflows) | release, static quality, showcase build/deploy/eval, unit test, plugin skills check workflow가 있다. |

## 세 관점

| 관점 | 보는 위치 | 핵심 질문 |
| --- | --- | --- |
| 제품/SDK 관점 | `README.md`, `packages/`, `sdk-python/` | CopilotKit이 앱 개발자에게 어떤 API와 runtime을 제공하는가 |
| 검증/예제 관점 | `examples/`, `showcase/`, `.github/workflows/` | 여러 framework와 demo가 실제로 빌드되고 동작하는가 |
| agent 운영 관점 | `skills/`, `.claude/`, `AGENTS.md`, `CLAUDE.md` | coding agent가 이 큰 monorepo를 어떻게 읽고 고치는가 |

## 처음 읽을 때의 순서

1. [`README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/README.md)에서 CopilotKit이 어떤 제품인지 본다.
2. [`dev-docs/architecture/ARCHITECTURE.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/dev-docs/architecture/ARCHITECTURE.md)에서 frontend, runtime, agent의 3계층을 본다.
3. [`packages/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages)에서 배포 패키지 경계를 본다.
4. [`examples/README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/examples/README.md)에서 통합 예제와 showcase 예제의 범위를 본다.
5. [`showcase/README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/showcase/README.md)에서 demo fleet 운영 구조를 본다.
6. [`skills/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills)와 [`.claude/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/.claude)를 보고 이 repository가 coding agent에게 어떤 작업 규칙을 주는지 본다.

## 주의할 경계

CopilotKit repository의 `docs`는 일반적인 GitHub Pages용 `docs/` 폴더가 아니다. 이 repo에서는 [`docs`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/docs)가 `showcase/shell-docs`를 가리키는 문서 영역으로 쓰인다. 그래서 이 GitHub Pages는 별도 [`site/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/codex/copilotkit-source-pages/site) VitePress 프로젝트에서 빌드된다.

## Takeaway

이 repository는 “CopilotKit 라이브러리 소스”만 있는 곳이 아니다. 제품 패키지, runtime, 여러 frontend surface, bot adapter, Python SDK, demo fleet, docs, release tooling, agent skills가 같이 있는 큰 작업장이다. 따라서 제대로 읽으려면 package code만 보지 말고 examples와 showcase, skills와 workflow까지 같이 봐야 한다.
