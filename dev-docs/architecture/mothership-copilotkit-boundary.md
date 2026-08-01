# Mothership and CopilotKit Boundary

작성일: 2026-08-01

이 문서는 공개 가능한 수준에서 Mothership 방식과 CopilotKit이 공존하는 경계를 정리한다.
내부 Mothership 구현 파일, 비공개 운영 지식, host 경로, 세부 tool catalog는 공개 문서에
적지 않는다.

핵심은 간단하다.

```text
Mothership이 기존 agent 실행과 native/provider stream을 먼저 소유한다.
CopilotKit은 AG-UI projection, FrontendTool, renderer, runtime UI layer로 붙는다.
```

## 왜 겹치는가

CopilotKit도 자체 실행 loop가 있다.

```text
agent가 frontend tool call emit
-> browser handler 실행
-> CopilotKit이 role: "tool" result 삽입
-> followUp !== false 이면 CopilotKit이 agent를 자동 재실행
```

Mothership도 자체 실행 loop가 있다.

```text
Mothership run/turn/session
-> native/provider stream 수신
-> tool result / permission / question / evidence 저장
-> 같은 session continuation
-> transcript / status / UI / AG-UI projection
```

따라서 CopilotKit frontend tool이 Mothership API를 호출한 뒤 CopilotKit이 자동으로 agent를
다시 실행하면, Mothership continuation과 CopilotKit follow-up run이 겹친다. 이게 기존
에이전트 방식을 망가뜨리는 지점이다.

## `followUp: false`의 의미

`followUp`은 Mothership 옵션이 아니라 CopilotKit `FrontendTool` 옵션이다.

CopilotKit source 기준:

- `packages/core/src/types.ts`: `FrontendTool`에 `followUp?: boolean`이 있다.
- `packages/core/src/core/run-handler.ts`: handler result를 tool message로 넣은 뒤
  `tool?.followUp !== false`이면 follow-up이 필요하다고 판단한다.
- `examples/v2/docs/reference/frontend-tool.mdx`: 기본값은 true이며, false면 tool 완료 후
  agent를 자동 재실행하지 않는다.

즉 `followUp: false`는 handler 실행을 막지 않는다. Mothership API 호출도 막지 않는다.
막는 것은 CopilotKit의 자동 agent 재실행이다.

Mothership bridge tool에서는 이것이 경계 스위치다.

```tsx
useFrontendTool({
  name: "answer_mothership_question",
  parameters: z.object({
    runId: z.string(),
    requestId: z.string(),
    answer: z.string(),
  }),
  followUp: false,
  handler: async ({ runId, requestId, answer }) => {
    await mothership.answerQuestion({ runId, requestId, answer });
    return { accepted: true, owner: "mothership" };
  },
});
```

이 tool result 이후의 continuation은 CopilotKit이 만들지 않는다. 기존 Mothership session과
native/provider stream이 만든다.

## 역할 경계

| 영역 | Mothership | CopilotKit |
| --- | --- | --- |
| 실행 원천 | 기존 agent session, native/provider stream, backend tool 결과 | 직접 소유하지 않음. 등록된 AG-UI agent에 위임 |
| stream | Mothership이 먼저 소비하고 저장 | Mothership이 투영한 AG-UI event만 소비 |
| tool result | 기존 agent가 다음 행동을 판단할 원본 결과 | renderer 표시와 tool result message projection |
| permission/question | Mothership pending interaction으로 되돌림 | 사용자 UI와 bridge frontend tool 제공 |
| 완료 판정 | Mothership evidence/readback | `RUN_FINISHED` 등 projection lifecycle |
| 저장 | Mothership canonical ledger/evidence | UI replay 또는 projection cache |

## 공존 방법

### 1. Mothership-first AG-UI endpoint

핵심 원칙이다. 단, 아래 흐름의 `CopilotKit Runtime`과 `HttpAgent` 직접 연결은
의도적으로 선택해야 한다. 두 방식은 같은 의미가 아니다.

```text
Browser
-> CopilotKit UI
-> CopilotKit Runtime -> HttpAgent -> Mothership AG-UI endpoint
   또는
-> selfManagedAgents/HttpAgent -> Mothership AG-UI endpoint
-> 기존 Mothership runtime
-> native/provider stream
-> Mothership ledger/evidence
-> AG-UI projection
-> CopilotKit UI
```

규칙:

- Mothership이 기존 stream을 먼저 소비한다.
- CopilotKit에는 AG-UI projection만 제공한다.
- Mothership backend/native tool을 CopilotKit frontend tool로 직접 등록하지 않는다.
- CopilotKit frontend tool은 Mothership bridge command만 담당한다.
- bridge command에는 `followUp: false`를 두어 CopilotKit 자동 follow-up을 끊는다.

CopilotKit의 일반적인 runtime-backed integration에서는
`CopilotRuntime -> HttpAgent -> AG-UI endpoint`가 지원되는 구조다. Runtime이
server-side routing, middleware, auth boundary를 제공하기 때문이다. 하지만
Mothership-first 관점에서는 이것이 유일한 권장안이 아니다. Runtime이 필요 없거나
이중 라우트가 부담이면 `selfManagedAgents`로 `HttpAgent`를 브라우저에 직접 등록하는
구성이 Mothership projection에는 더 단순하다.

SSE 관점에서 runtime bridge는 raw passthrough가 아니다.

```text
Mothership AG-UI SSE
-> CopilotKit Runtime의 HttpAgent가 event로 소비
-> AgentRunner가 event를 관찰/저장/compaction/finalize
-> Runtime이 EventEncoder로 새 SSE를 브라우저에 재발행
```

따라서 runtime bridge가 살아남으려면 다음을 검증해야 한다.

- upstream Mothership SSE가 long-running 연결을 안정적으로 유지한다.
- CopilotKit Runtime 배포 환경이 downstream SSE를 buffering 없이 flush한다.
- browser abort가 CopilotKit Runtime을 거쳐 Mothership run abort까지 전달된다.
- reconnect/connect 시 CopilotKit runner replay와 Mothership replay가 충돌하지 않는다.
- `followUp: false`로 bridge command 이후 CopilotKit 자동 continuation이 끊긴다.

위 조건을 통과하지 못하면 공존은 "불가능"으로 판단해야 한다. 그때는
`selfManagedAgents` 직접 연결, CopilotKit renderer-only 사용, 또는 CopilotKit 통합
제외 중 하나를 선택한다.

### 2. Self-managed Mothership agent

CopilotKit Runtime이 중간에서 runner/store/middleware를 갖는 것도 부담이면
`selfManagedAgents`에 `HttpAgent`를 등록해 browser가 Mothership AG-UI endpoint에
직접 붙는다.

```text
Browser -> HttpAgent -> Mothership AG-UI endpoint -> Mothership runtime
```

이 경우 인증, CORS, rate limit, replay, thread 접근 제어는 Mothership endpoint가 직접
책임진다.

### 3. CopilotKit Runtime은 projection proxy로만 사용

CopilotKit Runtime을 써야 한다면 Runtime 뒤 agent는 Mothership endpoint를 가리키는
`HttpAgent`여야 한다. Runtime runner는 AG-UI projection replay/cache일 뿐이며, 기존
native/provider stream의 source of truth가 되면 안 된다.

### 4. CopilotKit이 이미 SDK를 직접 실행하는 경우

이 구성은 기존 Mothership 방식과 충돌한다.

```text
Browser -> CopilotKit Runtime -> direct SDK/BuiltInAgent -> provider stream
```

이때 Mothership은 upstream stream을 못 본다. 해결책은 둘 중 하나다.

- SDK 실행을 Mothership 뒤로 옮긴다.
- 임시로 tee/custom runner를 둔다. 단, 이 경우 Mothership은 projection-level event만 볼 수
  있으므로 canonical evidence로 쓰기 어렵다.

## ID 매핑

| CopilotKit / AG-UI | Mothership |
| --- | --- |
| `agentId` | Mothership surface id |
| `threadId` | stable Mothership run id |
| `runId` | Mothership turn id 또는 correlation id |
| tool call id | Mothership pending command 또는 tool correlation id |
| provider session id | browser가 만들지 않고 Mothership이 소유 |

browser reconnect, CopilotKit thread 변경, UI refresh가 새 Mothership session을 만들면 안 된다.

## 공개 문서에 쓰지 않을 것

- 내부 repository absolute path
- 비공개 tool catalog 이름
- host token, environment, billing, local filesystem 구조
- raw event payload 전체
- 내부 evidence archive schema
- private product surface 이름이 필요한 세부 동작

## 통합 체크리스트

- [ ] 기존 Mothership runtime이 native/provider stream의 첫 소비자다.
- [ ] Mothership AG-UI endpoint는 `RunAgentInput`을 받고 AG-UI SSE를 반환한다.
- [ ] CopilotKit에는 raw stream이 아니라 sanitized AG-UI projection만 보낸다.
- [ ] CopilotKit `threadId`와 Mothership run id 매핑을 저장한다.
- [ ] CopilotKit `runId`와 Mothership turn/correlation id 매핑을 저장한다.
- [ ] permission/question bridge tool은 Mothership pending interaction endpoint로 되돌린다.
- [ ] Mothership bridge frontend tool은 `followUp: false`를 사용한다.
- [ ] backend/native tool을 CopilotKit frontend tool로 직접 등록하지 않는다.
- [ ] CopilotKit runner store를 canonical evidence로 쓰지 않는다.
- [ ] 완료 판정은 Mothership evidence/readback 기준이다.

## 최종 계약

CopilotKit은 Mothership을 대체하지 않는다.

Mothership이 실행한다.
Mothership이 관찰한다.
Mothership이 evidence를 가진다.
CopilotKit은 AG-UI로 보여주고, 필요한 bridge action만 Mothership으로 되돌린다.
