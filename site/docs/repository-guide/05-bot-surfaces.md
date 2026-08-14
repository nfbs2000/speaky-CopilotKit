---
title: 5. Bot Surfaces
description: CopilotKit bot engine과 Slack/Teams/Discord/Telegram/WhatsApp adapter 경계를 정리합니다.
---

# 5. Bot Surfaces

CopilotKit은 브라우저 안의 UI만 다루지 않는다. [`@copilotkit/bot`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot)은 platform-agnostic bot engine이고, 각 `bot-*` package가 Slack, Teams, Discord, Telegram, WhatsApp 같은 표면에 붙는다.

## Bot engine

[`@copilotkit/bot`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot)의 README는 이 package를 “incoming message와 rendered reply 사이”를 소유하는 engine으로 설명한다. 핵심은 Slack 같은 특정 platform을 직접 알지 않고 `PlatformAdapter` contract를 통해 연결한다는 점이다.

| 책임 | 설명 |
| --- | --- |
| Handler registration | mention, message, command, interaction, interrupt handler를 등록한다. |
| Agent run loop | thread 안에서 agent run, tool, interrupt, resume 흐름을 운전한다. |
| JSX action binding | JSX UI의 interactive handler를 opaque id로 묶는다. |
| Thread abstraction | `post`, `update`, `delete`, `stream`, `runAgent`, `resume`, `awaitChoice` 같은 per-conversation API를 제공한다. |
| PlatformAdapter boundary | Slack/Teams/Discord 등 platform별 ingress/egress 구현을 분리한다. |

## Bot UI

[`@copilotkit/bot-ui`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot-ui)는 JSX runtime, intermediate representation, cross-platform component vocabulary다. Bot engine은 이 vocabulary를 platform adapter가 native payload로 바꿀 수 있게 한다.

## Platform adapters

| Adapter | 표면 |
| --- | --- |
| [`@copilotkit/bot-slack`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot-slack) | Slack workspace, Bolt/Socket Mode, Block Kit, streaming, interactions, HITL |
| [`@copilotkit/bot-teams`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot-teams) | Microsoft Teams |
| [`@copilotkit/bot-discord`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot-discord) | Discord |
| [`@copilotkit/bot-telegram`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot-telegram) | Telegram |
| [`@copilotkit/bot-whatsapp`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/packages/bot-whatsapp) | WhatsApp Cloud API |

## Slack adapter가 보여 주는 것

Slack adapter는 bot surface의 좋은 예다. [`packages/bot-slack/README.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/packages/bot-slack/README.md)는 Slack adapter가 Bolt ingress, Block Kit egress, text streaming, opaque-id interactions, HITL을 담당한다고 설명한다.

| 기능 | 의미 |
| --- | --- |
| Socket Mode | outbound WebSocket으로 Slack workspace와 연결할 수 있다. |
| Routing | DM, app mention, thread reply를 어떤 handler로 보낼지 정한다. |
| JSX to Block Kit | `@copilotkit/bot-ui` vocabulary를 Slack Block Kit으로 바꾼다. |
| Streaming | Slack native streaming API 또는 legacy `chat.update` fallback으로 응답을 보낸다. |
| Feedback/HITL | feedback buttons, interaction, interrupt/resume 흐름을 처리한다. |

## Web app과 bot의 차이

| 비교 | Web frontend | Bot surface |
| --- | --- | --- |
| UI host | browser/native app | Slack, Teams, Discord 같은 external platform |
| Rendering target | React/Angular/Vue/components | Block Kit, Teams cards, Discord components 등 |
| State ownership | app state와 provider가 중심 | thread/conversation abstraction이 중심 |
| Tool execution | frontend tool 또는 runtime tool | bot tool과 platform capability가 중심 |
| HITL | custom app component | native button/select/modal/interaction |

## Takeaway

CopilotKit의 “beyond browser”는 별도 제품군이 아니라 같은 agent loop를 다른 interaction surface로 투영하는 구조다. `@copilotkit/bot`은 platform-independent core이고, adapter package들이 각 chat platform의 native 제약과 rendering 방식을 책임진다.
