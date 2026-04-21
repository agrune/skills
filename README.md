# agrune Skills

Agrune 스킬과 Claude Code 플러그인 래퍼 저장소입니다.

## 설치

```bash
claude plugin marketplace add https://github.com/agrune/skills
claude plugin install agrune@agrune
```

플러그인은 번들된 `mcp-server`를 포함하지 않고, 실행 시 `@agrune/mcp` 패키지를 호출합니다.

## 시작하기

```
/agrune:setup
```

## 스킬

- `/agrune:setup` — 원스톱 온보딩 (환경 검증 → 브라우저 연결 확인 → manifest 생성)
- `/agrune:manifest [auto|interactive]` — React/웹 프로젝트에 `manifest.ts` 생성 (defineManifest + defineTarget)
- `/agrune:guide` — MCP 도구 사용 가이드
