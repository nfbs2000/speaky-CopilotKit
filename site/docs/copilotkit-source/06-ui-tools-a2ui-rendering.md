---
title: UI Tools와 A2UI
description: useFrontendTool, useRenderTool, useHumanInTheLoop, A2UI renderer의 경계를 코드 레벨로 정리하고 tool result ownership을 설명합니다.
---

# 6. UI Tools와 A2UI

이 장은 CopilotKit의 frontend tool, renderer, HITL, A2UI를 코드 레벨로 봅니다. 핵심은 다음 구분입니다.

## 짧은 답

`useFrontendTool`은 agent가 호출할 수 있는 capability를 등록하고, `useRenderTool`은 tool call/result를 보여주는 projection만 등록합니다. `useHumanInTheLoop`은 사용자 결정을 tool result로 되돌리고, A2UI는 catalog 기반 UI operation surface입니다. backend execution ownership은 renderer가 아니라 runtime에 남아야 합니다.

```text
handler는 agent가 호출하는 capability다.
renderer는 capability 실행 상태와 결과를 보여주는 projection이다.
A2UI는 catalog 기반 UI operation surface다.
이 셋은 같은 것이 아니다.
```

## `useFrontendTool`: capability를 여는 hook

`useFrontendTool`은 agent가 호출할 수 있는 frontend capability를 등록합니다.

근거:

| Source | 내용 |
| --- | --- |
| [`use-frontend-tool.tsx#L7`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-frontend-tool.tsx#L7) | hook이 tool definition을 받습니다. |
| [`use-frontend-tool.tsx#L23`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-frontend-tool.tsx#L23) | core에 tool을 등록하고 duplicate name/agentId tool을 override할 수 있습니다. |
| [`use-frontend-tool.tsx#L35`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-frontend-tool.tsx#L35) | `tool.render`가 있으면 renderer도 등록합니다. |
| [`use-frontend-tool.tsx#L38`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-frontend-tool.tsx#L38) | cleanup은 tool을 제거하지만 renderer는 chat history 때문에 유지합니다. |

이 hook을 쓸 때 가장 중요한 판단은 “이 capability를 browser/frontend가 실행해도 되는가”입니다.

적합한 tool:

| Tool | 이유 |
| --- | --- |
| current canvas selection 읽기 | browser UI state가 원천입니다. |
| local panel 열기 | browser UI action입니다. |
| 사용자에게 선택지 요청 | human decision이 필요합니다. |
| client-only preview 만들기 | backend state를 바꾸지 않습니다. |

위험한 tool:

| Tool | 이유 |
| --- | --- |
| backend workflow 실행 | domain runtime의 auth, logging, retry, audit가 필요합니다. |
| deploy | agent loop와 server observation이 필요합니다. |
| file write | permission, rollback, result observation이 중요합니다. |
| Mothership native tool 재실행 | Mothership protocol의 executor ownership을 깨뜨릴 수 있습니다. |

Mothership처럼 이미 server-side tool executor가 있는 시스템에서는 frontend tool로 backend tool을 다시 구현하면 안 됩니다. frontend tool은 browser-only capability와 human decision boundary에 제한하는 편이 안전합니다.

## `useRenderTool`: projection을 등록하는 hook

`useRenderTool`은 tool call renderer를 등록합니다.

근거:

| Source | 내용 |
| --- | --- |
| [`use-render-tool.tsx#L9`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-render-tool.tsx#L9) | render props status는 `inProgress`, `executing`, `complete`로 나뉩니다. |
| [`use-render-tool.tsx#L45`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-render-tool.tsx#L45) | wildcard renderer overload가 있습니다. |
| [`use-render-tool.tsx#L78`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-render-tool.tsx#L78) | named renderer overload가 있습니다. |
| [`use-render-tool.tsx#L156`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-render-tool.tsx#L156) | renderer를 registry에 등록합니다. |

renderer는 다음을 해야 합니다.

| 해야 할 일 | 이유 |
| --- | --- |
| `toolCallId` 기준으로 상태를 표시 | 같은 invocation을 추적해야 합니다. |
| `executing`과 `complete`를 명확히 구분 | 사용자가 아직 끝나지 않은 일을 성공으로 오해하면 안 됩니다. |
| result를 그대로 또는 요약해서 표시 | agent observation과 UI display를 분리합니다. |
| error 상태를 별도 표시 | retry/repair 판단에 필요합니다. |

renderer가 하면 안 되는 일:

| 하지 말아야 할 일 | 이유 |
| --- | --- |
| result를 agent에게 돌려주지 않고 local success로 끝내기 | follow-up/replan이 끊깁니다. |
| backend tool execution을 몰래 수행 | executor ownership이 깨집니다. |
| UI complete를 task complete로 해석 | workflow는 후속 검증이 필요할 수 있습니다. |
| `followUp: false`를 default처럼 쓰기 | observation loop가 끊깁니다. |

## `useHumanInTheLoop`: 사용자 결정을 tool result로 돌려준다

HITL은 사용자에게 물어보고 UI에서 끝내는 기능이 아닙니다. 사용자 결정을 agent loop로 되돌리는 tool입니다.

근거:

| Source | 내용 |
| --- | --- |
| [`use-human-in-the-loop.tsx#L20`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-human-in-the-loop.tsx#L20) | `respond` promise handler와 abort 처리를 만듭니다. |
| [`use-human-in-the-loop.tsx#L59`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-human-in-the-loop.tsx#L59) | executing 상태에서만 `respond`를 renderer에 제공합니다. |
| [`use-human-in-the-loop.tsx#L107`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-human-in-the-loop.tsx#L107) | HITL을 frontend tool로 감쌉니다. |
| [`use-human-in-the-loop.tsx#L115`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-human-in-the-loop.tsx#L115) | unmount되면 renderer를 제거합니다. unmounted interaction은 응답할 수 없기 때문입니다. |

Mothership checkpoint pause와 잘 맞는 패턴입니다. 다만 checkpoint의 원천은 Mothership run이어야 합니다. CopilotKit HITL은 checkpoint를 표시하고 approve/reject/resume action을 Mothership protocol로 보내는 역할이 맞습니다.

## Provider가 tools와 renderers를 합치는 방식

`CopilotKitProvider`는 여러 출처의 tools/renderers를 합칩니다.

근거:

| Source | 내용 |
| --- | --- |
| [`CopilotKitProvider.tsx#L455`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/providers/CopilotKitProvider.tsx#L455) | frontend tools, built-in `generateSandboxedUi`, HITL tools를 합칩니다. |
| [`CopilotKitProvider.tsx#L541`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/providers/CopilotKitProvider.tsx#L541) | props/tools/HITL에서 온 renderers를 결합합니다. |
| [`CopilotKitProvider.tsx#L633`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/providers/CopilotKitProvider.tsx#L633) | executing tool call IDs를 `onToolExecutionStart/End`로 추적합니다. |

이 구조 때문에 provider-level tool, hook-level tool, HITL tool, built-in generative UI tool이 같은 run input에 들어갈 수 있습니다. 그만큼 tool ownership을 분명히 해야 합니다.

## A2UI: agent가 기존 UI를 조작하는 방식

사용자가 말한 “CopilotKit은 AG-UI라서 기존 UI를 완전히 가지고 놀 수 있는 방식”은 A2UI 관점에서는 상당히 맞습니다. 다만 정확히는 “모델이 DOM을 마음대로 만지는 것”이 아니라, 앱이 catalog로 허용한 component schema와 operation vocabulary 안에서 agent가 surface를 갱신하는 것입니다.

근거:

| Source | 내용 |
| --- | --- |
| [`CopilotKitProvider.tsx#L184`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/providers/CopilotKitProvider.tsx#L184) | `a2ui` prop 설명과 runtime reported A2UI 활성화 경로가 있습니다. |
| [`CopilotKitProvider.tsx#L297`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/providers/CopilotKitProvider.tsx#L297) | runtime A2UI enabled 또는 catalog 제공 여부로 A2UI active를 계산합니다. |
| [`CopilotKitProvider.tsx#L823`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/providers/CopilotKitProvider.tsx#L823) | A2UI built-in renderer와 catalog context를 provider tree에 넣습니다. |
| [`A2UIMessageRenderer.tsx#L24`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/a2ui/A2UIMessageRenderer.tsx#L24) | A2UI operation key는 `a2ui_operations`입니다. |
| [`A2UIMessageRenderer.tsx#L347`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/a2ui/A2UIMessageRenderer.tsx#L347) | `ReactSurfaceHost`가 `A2UIProvider`와 `A2UIRenderer`를 감쌉니다. |
| [`create-catalog.ts#L45`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/a2ui-renderer/src/web-components/create-catalog.ts#L45) | catalog를 생성합니다. |
| [`create-catalog.ts#L200`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/a2ui-renderer/src/web-components/create-catalog.ts#L200) | catalog context value를 만듭니다. |

## A2UI action bridge

A2UI surface 안에서 사용자가 action을 하면 `runA2UIAction`이 CopilotKit property에 action을 넣고 agent run을 다시 호출합니다.

근거:

| Source | 내용 |
| --- | --- |
| [`A2UIMessageRenderer.tsx#L293`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/a2ui/A2UIMessageRenderer.tsx#L293) | `a2uiAction`을 properties에 넣고 `runAgent`를 호출합니다. |
| [`A2UIMessageRenderer.tsx#L329`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/a2ui/A2UIMessageRenderer.tsx#L329) | run이 끝나면 `a2uiAction`을 properties에서 제거합니다. |
| [`A2UIMessageRenderer.tsx#L398`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/a2ui/A2UIMessageRenderer.tsx#L398) | operation hash를 계산하고 중복 createSurface를 필터링합니다. |

이 구조는 Mothership UI에도 유용합니다. 예를 들어 workflow card에서 approve, rerun, inspect logs 같은 버튼을 누르면 local state만 바꾸는 것이 아니라 Mothership run에 action을 보내고, 그 결과 stream을 다시 AG-UI로 받아야 합니다.

## OpenGenerativeUI와 A2UI를 구분하기

OpenGenerativeUI는 A2UI와 다른 경로입니다. `generateSandboxedUi` tool args를 middleware가 activity event로 바꾸어 streaming UI generation progress를 보여줍니다.

근거:

| Source | 내용 |
| --- | --- |
| [`open-generative-ui-middleware.ts#L15`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/runtime/src/v2/runtime/open-generative-ui-middleware.ts#L15) | tool/activity type을 정의합니다. |
| [`open-generative-ui-middleware.ts#L39`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/runtime/src/v2/runtime/open-generative-ui-middleware.ts#L39) | streaming args parser가 있습니다. |
| [`open-generative-ui-middleware.ts#L242`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/runtime/src/v2/runtime/open-generative-ui-middleware.ts#L242) | middleware가 run stream을 처리합니다. |

Mothership에 바로 필요한 것은 OpenGenerativeUI보다 AG-UI event adapter와 A2UI-like domain surfaces입니다. Mothership은 이미 workflow, tool, file, resource, checkpoint라는 domain object가 있으므로, generated UI보다 domain UI renderer가 더 먼저입니다.

## 설계 규칙

CopilotKit UI tools를 Mothership 같은 시스템에 붙일 때의 규칙입니다.

| 규칙 | 이유 |
| --- | --- |
| backend domain tool은 Mothership executor가 소유한다 | auth, audit, retry, streaming, checkpoint ownership을 유지합니다. |
| CopilotKit frontend tool은 browser-only capability와 human decision에 제한한다 | 중복 실행과 result 손실을 막습니다. |
| renderer는 event/result projection만 한다 | agent observation을 가로채면 안 됩니다. |
| tool result는 반드시 agent/runtime observation으로 돌아간다 | replan, verify, next action의 입력입니다. |
| A2UI action은 properties 또는 app action으로 runtime에 되돌린다 | UI click이 agent loop로 연결되어야 합니다. |
| `followUp: false`는 terminal client action에만 쓴다 | read/write/run/deploy workflow를 끊으면 안 됩니다. |

## 예시: Mothership workflow card

좋은 workflow card는 다음 책임만 가집니다.

```text
input:
  Mothership tool_call, args_delta, result, resource, checkpoint events

render:
  status, args preview, logs, result summary, retry or approve controls

action:
  approve/reject/rerun/open logs action을 Mothership endpoint로 보냄

not allowed:
  card 자체가 workflow success를 확정하거나 agent follow-up을 끊음
```

이 구조라면 CopilotKit은 Mothership을 가로채는 것이 아니라 Mothership을 더 잘 보이게 만드는 UI protocol layer가 됩니다.

## 결론

`useFrontendTool`, `useRenderTool`, HITL, A2UI는 모두 강력하지만 서로 다른 경계입니다.

```text
frontend tool = capability
renderer = projection
HITL = human decision as tool result
A2UI = catalog-based UI operation surface
AG-UI = event protocol underneath
```

Mothership에 필요한 것은 이 경계를 유지하는 것입니다. tool result와 checkpoint ownership을 UI card로 옮기면 agent loop가 깨집니다. 반대로 ownership을 Mothership protocol에 두고 CopilotKit을 AG-UI/A2UI projection으로 쓰면 기존 UI를 agent-native surface로 확장할 수 있습니다.
