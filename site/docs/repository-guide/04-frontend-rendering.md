---
title: 4. Frontend와 Rendering
description: CopilotKit의 frontend surface, hooks, rendering, A2UI, HITL 흐름을 정리합니다.
---

# 4. Frontend와 Rendering

CopilotKit frontend는 “채팅창 하나”로 끝나지 않는다. React hooks, prebuilt UI, headless API, framework integration, A2UI renderer, shared state, tool rendering, human-in-the-loop이 같이 있다.

## React 계열

| Package | 읽는 법 |
| --- | --- |
| [`@copilotkit/react-core`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/react-core) | provider와 hooks의 핵심이다. agent 실행, chat state, frontend tool, shared context, HITL의 중심으로 읽는다. |
| [`@copilotkit/react-ui`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/react-ui) | prebuilt UI layer다. chat, popup, sidebar 같은 화면 컴포넌트를 제공한다. |
| [`@copilotkit/react-textarea`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/react-textarea) | text editing surface다. |

README의 예시는 CopilotKit frontend가 두 방향을 제공한다는 것을 보여 준다.

| 방향 | 의미 |
| --- | --- |
| Headless API | app이 직접 message list, input, rendering을 소유하고 hooks만 사용한다. |
| Prebuilt UI | `CopilotPopup` 같은 component로 빠르게 assistant UI를 붙인다. |

## Framework surface

| Surface | Package |
| --- | --- |
| React / Next.js | `@copilotkit/react-core`, `@copilotkit/react-ui` |
| Angular | [`@copilotkit/angular`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/angular) |
| Vue | [`@copilotkit/vue`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/vue) |
| React Native | [`@copilotkit/react-native`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/react-native) |
| Web Components | [`@copilotkit/web-components`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/web-components) |

중요한 점은 frontend framework가 바뀌어도 agent loop의 핵심은 runtime과 AG-UI event stream이라는 점이다. Framework package는 같은 CopilotKit 개념을 각 UI 생태계에 맞춰 노출한다.

## Tool rendering

CopilotKit의 agent는 text만 내보내지 않는다. Agent가 tool을 호출하면 UI는 tool call 상태, arguments, result, 승인 UI, custom component를 표시할 수 있다.

| 패턴 | 설명 |
| --- | --- |
| Frontend tool | 브라우저/app이 가진 기능을 agent가 호출하게 한다. |
| Render tool call | tool call status와 args를 UI component로 보여 준다. |
| Render and wait | 사람이 승인, 선택, 수정한 뒤 agent loop를 계속 진행한다. |
| Shared state rendering | agent state 변화가 UI component에 반영된다. |

## A2UI

[`@copilotkit/a2ui-renderer`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/a2ui-renderer)는 A2UI surface를 React application에서 render하기 위한 package다. Package metadata는 이 package가 `a2ui`, `react`, `renderer`, `tanstack-intent`, `ui`를 키워드로 가진다는 것을 보여 준다.

A2UI는 CopilotKit의 generative UI 축 중 하나다. 고정된 React component만 렌더링하는 것이 아니라, agent가 UI intent나 schema 기반 surface를 만들어 내고 renderer가 그것을 앱 안에서 보여 주는 방향으로 읽는다.

## Human-in-the-loop

CopilotKit frontend의 강한 지점은 HITL을 단순 confirm dialog가 아니라 agent run loop 안의 일시 정지/응답으로 다룰 수 있다는 점이다.

| HITL 상황 | UI가 하는 일 |
| --- | --- |
| 승인 필요 | 사용자가 approve/reject를 선택한다. |
| 값 수정 필요 | 사용자가 draft나 form 값을 고친다. |
| 선택 필요 | 사용자가 option을 선택하고 agent loop가 이어진다. |
| 위험한 작업 | tool execution 전에 사람이 확인한다. |

## Web inspector와 observability 표면

[`@copilotkit/web-inspector`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/web-inspector)는 CopilotKit web inspector component다. Runtime과 frontend가 event stream으로 연결될 때는 “무슨 event가 왔는가”, “어떤 tool call이 실행됐는가”, “state가 어떻게 바뀌었는가”를 보는 도구가 중요해진다.

## Takeaway

CopilotKit frontend는 chat UI package보다 넓다. App state, tool, custom rendering, A2UI, HITL을 agent event stream과 묶는 frontend application layer다. 그래서 소개 문서는 React component 목록이 아니라 “agent가 UI와 어떻게 상호작용하는가”를 설명해야 한다.
