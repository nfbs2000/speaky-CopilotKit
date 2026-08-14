---
title: 7. Skills와 개발 운영
description: CopilotKit repository의 AI coding agent skills, .claude 지침, GitHub workflow를 정리합니다.
---

# 7. Skills와 개발 운영

이 repository는 AI coding agent가 직접 작업하는 환경을 전제로 한다. 그래서 제품 코드와 별도로 [`skills/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills), [`.claude/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/.claude), `AGENTS.md`, `CLAUDE.md`, workflow 문서가 중요하다.

## Agent-facing instruction files

| 파일/경로 | 역할 |
| --- | --- |
| [`AGENTS.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/AGENTS.md) | Nx monorepo 작업 규칙, package 구조, docs 위치, skills 참고를 설명한다. |
| [`CLAUDE.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/CLAUDE.md) | Claude Code용 repository instruction이다. |
| [`.claude/docs/architecture.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/.claude/docs/architecture.md) | package roles, request lifecycle, AG-UI, ProxiedAgent, AgentRunner, tools, context, multi-agent를 읽는 문서다. |
| [`.claude/docs/documentation.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/.claude/docs/documentation.md) | product docs를 어디에 작성해야 하는지 정한다. |
| [`.claude/docs/git.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/.claude/docs/git.md) | branch, worktree, PR, commit 운영 규칙이다. |
| [`.claude/docs/workflow.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/.claude/docs/workflow.md) | plan, verification, self-improvement loop 같은 작업 방식이다. |
| [`.claude/docs/hooks.md`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/.claude/docs/hooks.md) | hook development checklist다. |

## Skills

[`skills/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills)는 coding agent가 CopilotKit 관련 작업을 할 때 읽는 `SKILL.md` 모음이다.

| Skill | 역할 |
| --- | --- |
| [`copilotkit-setup`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-setup) | CopilotKit 설치, provider, runtime endpoint, setup detection |
| [`copilotkit-develop`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-develop) | CopilotKit v2 feature 개발, frontend tools, app context, interrupts |
| [`copilotkit-agui`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-agui) | AG-UI protocol, SSE transport, event types, state sync, tool calls |
| [`copilotkit-integrations`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-integrations) | external agent framework integration |
| [`copilotkit-debug`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-debug) | runtime connectivity, streaming, tool execution, version mismatch diagnosis |
| [`copilotkit-upgrade`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-upgrade) | v1에서 v2/AG-UI runtime으로 migration |
| [`copilotkit-contribute`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-contribute) | monorepo contribution workflow |
| [`copilotkit-self-update`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/copilotkit-self-update) | agent skills 자체를 최신 상태로 refresh |
| [`react-core`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/react-core) | React core package 작업 지침 |
| [`runtime`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/runtime) | runtime package 작업 지침 |
| [`a2ui-renderer`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/skills/a2ui-renderer) | A2UI renderer 작업 지침 |

## Skill sync

[`scripts/sync-plugin-skills.ts`](https://github.com/nfbs2000/speaky-CopilotKit/blob/main/scripts/sync-plugin-skills.ts)는 package 내부 skill과 루트 `skills/` mirror의 drift를 검사하거나 동기화한다. `package.json`의 `check:plugin-skills`, `sync:plugin-skills` script가 이 흐름을 실행한다.

## Documentation rule

이 repository에서 product docs를 수정할 때는 top-level `docs/content/docs` 같은 옛 경로를 만들면 안 된다. `AGENTS.md`와 `CLAUDE.md`는 product docs source가 [`showcase/shell-docs/src/content/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/showcase/shell-docs/src/content) 아래라고 설명한다.

| 문서 종류 | 위치 |
| --- | --- |
| Guides/concepts | `showcase/shell-docs/src/content/docs/` |
| API reference | `showcase/shell-docs/src/content/reference/` |
| Shared snippets | `showcase/shell-docs/src/content/snippets/` |
| Framework overview | `showcase/shell-docs/src/content/framework-overviews/` |
| AG-UI docs mirror | `showcase/shell-docs/src/content/ag-ui/` |

## GitHub workflows

[`.github/workflows/`](https://github.com/nfbs2000/speaky-CopilotKit/tree/main/.github/workflows)는 일반 CI만 있는 곳이 아니다. Release, static quality, compatibility, showcase build/deploy/eval, plugin skills check, security check가 나뉘어 있다.

| 묶음 | 예시 |
| --- | --- |
| Release | `publish-release.yml`, `stable-release.yml`, `canary.yml` |
| Static checks | `static_quality.yml`, `static_compat.yml`, `static_bundle_size.yml`, `static_check-binaries.yml` |
| Showcase | `showcase_build.yml`, `showcase_deploy.yml`, `showcase_eval.yml`, `showcase_validate.yml` |
| Tests | `test_unit.yml`, `test_unit-python-sdk.yml`, `test_integration-runtime.yml`, `test_integration-docs.yml` |
| Skills | `plugin-skills-check.yml` |
| Security | `security_zizmor.yml`, `security_fork-pr-alert.yml` |

## Takeaway

CopilotKit repository는 coding agent가 대규모 monorepo를 직접 다루는 전제를 갖고 있다. 그래서 source code만 읽으면 부족하다. `skills/`, `.claude/`, docs rule, workflow가 이 repository의 운영 계층이고, 이것까지 포함해야 제대로 소개한 것이다.
