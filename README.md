# agrune Plugin

AI 에이전트가 브라우저를 제어할 수 있게 하는 Claude Code 플러그인.

## 설치

```bash
claude plugin marketplace add https://github.com/agrune/agrune-marketplace
claude plugin install agrune@agrune
```

## 시작하기

```
/agrune:start
```

## 스킬

- `/agrune:start` — 원스톱 온보딩 (환경 검증 → 확장 설치 → 어노테이션)
- `/agrune:annotate [auto|interactive]` — 컴포넌트에 data-agrune-* 어노테이션 추가
- `/agrune:guide` — MCP 도구 사용 가이드
