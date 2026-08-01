---
title: 6. Examples와 Showcase
description: CopilotKit examples와 showcase platform의 역할을 정리합니다.
---

# 6. Examples와 Showcase

CopilotKit은 source package만 봐서는 크기가 보이지 않는다. [`examples/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/examples)와 [`showcase/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/showcase)가 이 repository의 실제 검증 표면이다.

## Examples

[`examples/README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/examples/README.md)는 예제를 세 덩어리로 나눈다.

| 영역 | 수 | 의미 |
| --- | ---: | --- |
| Integrations | 17 | agent framework starter. LangGraph, Mastra, CrewAI, LlamaIndex, PydanticAI, Microsoft Agent Framework, Strands, MCP Apps, ADK, Agno 등이 있다. |
| Canvas | 7 | visual card, shared state, HITL, multi-step planning을 다루는 canvas app이다. |
| Showcases | 24 | banking, presentation, deep agents, generative UI, MCP apps, research canvas, kanban, spreadsheet, CRM 같은 완성형 demo app이다. |

## Integration examples

Integration examples는 “CopilotKit이 어떤 agent framework와 붙는가”를 보여 준다.

| 계열 | 예시 경로 |
| --- | --- |
| LangGraph | `examples/integrations/langgraph-python`, `langgraph-js`, `langgraph-fastapi` |
| CrewAI | `examples/integrations/crewai-flows`, `crewai-crews` |
| Mastra | `examples/integrations/mastra` |
| LlamaIndex | `examples/integrations/llamaindex` |
| PydanticAI | `examples/integrations/pydantic-ai` |
| Microsoft Agent Framework | `examples/integrations/ms-agent-framework-python`, `ms-agent-framework-dotnet` |
| A2A / A2UI / MCP Apps | `a2a-a2ui`, `a2a-middleware`, `mcp-apps` |

## Canvas examples

Canvas examples는 CopilotKit의 shared state, visual card, HITL 성격을 보여 준다. 단순 chat 대신 “agent가 UI 상태와 함께 작업한다”는 점을 확인하는 영역이다.

| 예시 | 읽는 질문 |
| --- | --- |
| `canvas/langgraph-python` | LangGraph agent와 canvas UI가 어떻게 동기화되는가 |
| `canvas/llamaindex` | multi-step planning과 visual card가 어떻게 붙는가 |
| `canvas/mastra-pm` | shared state와 multiple clients를 어떻게 다루는가 |
| `canvas/gemini` | Gemini 기반 canvas agent는 어떤 구조인가 |

## Showcase platform

[`showcase/README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/showcase/README.md)는 showcase를 별도 platform으로 설명한다. 이 영역은 demo app을 모아 둔 폴더가 아니라 framework별 demo fleet, shell, docs, harness, deployment tooling을 가진 운영 시스템이다.

| 경로 | 역할 |
| --- | --- |
| `showcase/integrations/<slug>/` | framework별 demo package. Dockerfile, Next.js frontend, agent backend, demos가 들어간다. |
| `showcase/shell/` | integration explorer와 canonical preview/code route의 hub다. |
| `showcase/shell-docs/` | CopilotKit product docs source다. top-level `docs`가 이 영역을 가리킨다. |
| `showcase/shell-dashboard/` | feature by integration grid 성격의 내부 overview다. |
| `showcase/harness/` | showcase health, probes, alerts, build/deploy 지원 도구다. |
| `showcase/aimock/` | replay/eval fixture와 Railway reconstruction 관련 영역이다. |
| `showcase/shared/` | feature registry, constraints, local ports, shared agent utilities가 있다. |
| `showcase/bin/showcase` | local Docker/service/test control CLI다. |

## Generated data

Showcase shell은 registry와 demo content를 build time에 생성한다.

| 파일 | 생성기 | 쓰임 |
| --- | --- | --- |
| `registry.json` | `generate-registry.ts` | integration manifest와 feature catalog |
| `demo-content.json` | `bundle-demo-content.ts` | demo source/code viewer |
| `constraints.json` | `generate-registry.ts` | integration explorer filter |
| `search-index.json` | `generate-search-index.ts` | docs/search entries |
| `docs-status.json` | `probe-docs.ts` | docs reachability |

## 왜 중요하나

Examples와 showcase는 CopilotKit이 실제로 다음을 지원하는지 확인하는 증거다.

| 질문 | 보는 곳 |
| --- | --- |
| 여러 agent framework가 같은 CopilotKit runtime과 붙는가 | `examples/integrations`, `showcase/integrations` |
| tool rendering과 generative UI가 실제 앱에서 동작하는가 | `examples/showcases/generative-ui`, `showcase/integrations/*/src/app/demos` |
| HITL, shared state, multimodal, MCP Apps 같은 기능이 데모로 유지되는가 | showcase demos와 probes |
| 문서와 demo source가 서로 맞는가 | `showcase/shell-docs`, generated registry, docs status |

## Takeaway

CopilotKit을 한 페이지로 소개하면 가장 중요한 검증 표면을 잃는다. 이 repository의 실제 힘은 package source와 examples/showcase가 함께 있다는 점이다. Product API를 읽은 뒤 반드시 examples와 showcase를 같이 봐야 한다.
