# 3. 모델과 CopilotKit의 통제 경계

질문은 이것입니다.

> CopilotKit이 모델을 통제하는가? 아니면 모델이 CopilotKit을 통제하는가?

짧은 답은 둘 다 아닙니다.

정확한 답은 다음입니다.

```text
앱은 CopilotKit으로 capability boundary를 등록한다.
모델/agent는 그 boundary 안에서 tool call을 선택한다.
CopilotKit은 tool call, handler, renderer, result, follow-up run을 연결한다.
domain runtime은 tool observation 이후 다음 action을 결정한다.
```

## 통제 관계를 분해하기

| 질문 | 책임 주체 | 실제 source 근거 |
| --- | --- | --- |
| 어떤 agent가 있는가 | `AgentRegistry`, runtime `/info` | [`agent-registry.ts`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/core/src/core/agent-registry.ts) |
| 어떤 context가 agent에게 보이는가 | `ContextStore`, `useAgentContext` | [`context-store.ts`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/core/src/core/context-store.ts) |
| 어떤 tool을 agent가 호출할 수 있는가 | app + `useFrontendTool` + `RunHandler` | [`use-frontend-tool.tsx`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-frontend-tool.tsx), [`run-handler.ts`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/core/src/core/run-handler.ts) |
| tool call을 선택하는가 | model/agent framework | AG-UI agent가 assistant tool call event/message를 생성 |
| frontend tool을 실행하는가 | `RunHandler` | [`executeSpecificTool`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/core/src/core/run-handler.ts#L573) |
| tool call을 어떻게 보여주는가 | app renderer | [`use-render-tool.tsx`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-render-tool.tsx) |
| 사용자 승인/수정을 어떻게 받는가 | `useHumanInTheLoop` | [`use-human-in-the-loop.tsx`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/react-core/src/v2/hooks/use-human-in-the-loop.tsx) |
| tool result 뒤에 계속 생각하는가 | `RunHandler` + agent loop | [`followUp !== false`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/core/src/core/run-handler.ts#L620) |

모델은 CopilotKit 전체를 통제하지 않습니다. 모델이 할 수 있는 것은 등록된 tool contract 안에서 tool name과 arguments를 선택하는 것입니다.

CopilotKit도 모델의 planning algorithm을 통제하지 않습니다. CopilotKit이 통제하는 것은 앱이 agent에게 무엇을 열어주는지, tool result가 어떻게 agent message history로 돌아가는지, renderer가 어떻게 표시되는지입니다.

## 모델이 CopilotKit을 통제한다는 말의 한계

모델이 실제로 생성하는 것은 대략 다음입니다.

```text
tool name
tool arguments
assistant text
state/tool/action intent expressed through AG-UI events
```

모델은 임의 DOM을 조작하지 않습니다. 임의 React component를 직접 mount하지 않습니다. 등록되지 않은 tool handler를 실행할 수도 없습니다.

`useFrontendTool` source를 보면 tool은 app이 등록합니다. hook은 mount 시 `copilotkit.addTool(tool)`을 호출하고, unmount 시 `removeTool`을 호출합니다. 즉 모델에게 열린 capability surface는 app이 정합니다.

```mermaid
flowchart LR
  App["app code"] --> Register["useFrontendTool registers tool"]
  Register --> Core["CopilotKitCore tool registry"]
  Core --> AgentInput["tools sent to agent"]
  AgentInput --> Model["model chooses tool call"]
  Model --> Core
  Core --> Handler["registered handler executes"]
```

그래서 “모델이 CopilotKit을 통제한다”는 표현은 넓고 부정확합니다.

더 정확한 표현은:

> 모델은 CopilotKit이 노출한 capability surface 안에서 tool call intent를 낸다.

## CopilotKit이 모델을 통제한다는 말의 한계

CopilotKit은 model weights, reasoning policy, planning algorithm을 직접 통제하지 않습니다.

CopilotKit이 통제하는 것은 다음입니다.

| CopilotKit이 통제하는 것 | 설명 |
| --- | --- |
| runtime boundary | 어떤 runtime URL/transport로 갈지 |
| agent registry | 어떤 agent가 available인지 |
| context boundary | 어떤 app state가 agent input이 되는지 |
| tool boundary | 어떤 tool schema/handler가 열리는지 |
| renderer boundary | tool call/result가 어떤 UI로 보이는지 |
| follow-up boundary | tool result 뒤 agent run을 이어갈지 |
| human boundary | 승인/수정/재개 입력을 어떻게 result로 돌려줄지 |

따라서 CopilotKit은 모델의 두뇌가 아니라 interaction boundary입니다.

## Tool result가 중요한 이유

`RunHandler`는 agent result에서 assistant tool call을 찾고, 등록된 tool handler를 실행하고, tool result를 agent messages에 삽입합니다. source의 핵심 흐름은 다음입니다.

```mermaid
sequenceDiagram
  participant Agent
  participant Core as CopilotKitCore RunHandler
  participant Tool as Frontend tool handler

  Agent-->>Core: assistant tool call
  Core->>Tool: execute handler
  Tool-->>Core: result string
  Core->>Agent: insert role=tool message
  Core->>Agent: run follow-up when followUp !== false
```

중요한 지점은 [`run-handler.ts#L612-L620`](https://github.com/nfbs2000/speaky-CopilotKit/blob/5c50d9c51/packages/core/src/core/run-handler.ts#L612)입니다. tool result는 `role: "tool"` message로 agent messages에 들어갑니다. 그리고 `followUp !== false`이면 follow-up run이 필요하다고 표시합니다.

즉 정상 경로는 “UI card에서 result를 소비하고 끝”이 아닙니다. 정상 경로는 “tool result가 agent observation으로 들어가고, agent가 다시 생각한다”입니다.

## Renderer는 observation을 대체하지 않는다

`useRenderTool`은 renderer를 등록합니다. source상 이 hook은 `renderToolCalls` registry에 renderer entry를 넣습니다. handler를 등록하지 않습니다.

```text
useRenderTool
  -> render registry
  -> inProgress / executing / complete UI
```

반면 `useFrontendTool`은 handler를 등록합니다.

```text
useFrontendTool
  -> tool registry
  -> handler execution
  -> optional render
```

이 차이를 놓치면 문제가 생깁니다.

```mermaid
flowchart TD
  ToolCall["agent emits tool call"] --> Card["tool card renders"]
  Card --> LocalDone["UI treats card as final"]
  LocalDone --> Lost["tool result not returned to agent"]
  Lost --> Broken["no replan / no next tool / no verification"]
```

renderer는 사용자에게 보이는 projection입니다. observation의 원본은 tool result입니다. renderer가 예쁘게 보인다는 사실은 agent가 result를 읽었다는 증거가 아닙니다.

## `followUp: false`의 위치

`followUp: false`는 강한 스위치입니다. tool result 뒤에 agent가 다시 생각하지 않아도 되는 pure UI action에는 쓸 수 있습니다. 하지만 result를 보고 다음 action을 골라야 하는 작업에는 쓰면 안 됩니다.

써도 되는 경우:

| 경우 | 이유 |
| --- | --- |
| panel open/close | agent observation이 필요 없는 local UI state |
| copy-to-clipboard | 이미 final answer가 있고 copy action만 남은 경우 |
| color/theme toggle | runtime goal과 무관한 client-only action |
| telemetry-only acknowledgement | planning input이 아님 |

쓰면 안 되는 경우:

| 경우 | 이유 |
| --- | --- |
| read result 뒤 write/run/deploy가 필요함 | read는 중간 evidence입니다. |
| test/log output을 보고 repair해야 함 | agent가 observation을 읽어야 합니다. |
| workflow create 뒤 execute/log/repair/rerun/deploy가 이어짐 | 한 tool 성공은 전체 목표 완료가 아닙니다. |
| OpenCode/LangGraph가 tool output으로 replan함 | tool result가 planner input입니다. |
| Mothership처럼 domain runtime이 다음 action을 결정함 | UI card complete가 task complete가 아닙니다. |

## Mothership 관점

Mothership에 CopilotKit을 붙일 때 중심은 CopilotKit tool card가 아니라 Mothership/OpenCode agent loop여야 합니다.

올바른 구조:

```mermaid
flowchart LR
  User["user"] --> UI["CopilotKit / custom UI"]
  UI --> Runtime["Mothership runtime"]
  Runtime --> Agent["OpenCode / OMAO loop"]
  Agent --> Tools["native tools"]
  Tools --> Agent
  Agent --> Runtime
  Runtime --> Projection["AG-UI / CopilotKit projection"]
  Projection --> UI
```

CopilotKit의 역할:

| 역할 | 해야 할 일 | 하지 말아야 할 일 |
| --- | --- | --- |
| UI adapter | tool call/result/status를 사용자에게 보여줌 | tool result를 UI에서 삼키기 |
| Protocol bridge | AG-UI event stream으로 projection | native agent loop를 대체 |
| Human boundary | approval, edit, resume input 전달 | pending run과 끊긴 local modal 만들기 |
| Renderer | domain-specific tool card 표시 | renderer state를 success evidence로 오해 |
| Context/tool bridge | browser-only capability 노출 | backend/domain tool을 frontend handler로 몰래 재실행 |

## 최종 답

CopilotKit이 모델을 통제하는 것도 아니고, 모델이 CopilotKit을 통째로 통제하는 것도 아닙니다.

```text
앱은 CopilotKit으로 capability boundary를 정한다.
모델은 그 boundary 안에서 tool call을 선택한다.
CopilotKit은 tool call/result/render/follow-up을 연결한다.
domain agent runtime은 observation을 읽고 다음 행동을 결정한다.
```

그래서 CopilotKit은 Mothership을 약하게 만드는 것이 아니라, Mothership의 native agent loop를 사용자에게 보이는 product surface로 바꿔주는 adapter가 되어야 합니다. 단, tool result ownership을 UI card가 가져가면 안 됩니다.
