# 캔버스 / 노드 에디터 어노테이션 패턴

## data-agrune-canvas 속성

줌/팬이 있는 캔버스 컨테이너에는 `data-agrune-canvas` 속성을 추가하여 agrune 런타임이 뷰포트↔캔버스 좌표 변환을 자동 처리할 수 있게 한다.

- **위치:** `data-agrune-group`과 같은 요소에 배치
- **값:** 그룹 내부의 transform이 적용된 요소를 가리키는 CSS 선택자

런타임이 내부적으로 transform을 파싱하여 canvas↔viewport 좌표 변환과 자동 팬을 처리한다. AI는 canvas 절대좌표만 사용.

```tsx
<div
  data-agrune-group="workflow-canvas"
  data-agrune-group-name="워크플로우 캔버스"
  data-agrune-group-desc="워크플로우 노드와 연결 편집"
  data-agrune-canvas=".react-flow__viewport"
  data-agrune-meta="getWorkflowMeta"
>
  <ReactFlow nodes={nodes} edges={edges} />
</div>
```

## 커스텀 노드 어노테이션

XYFlow 등에서 커스텀으로 렌더링하는 노드 컴포넌트는 **일반 JSX이므로 반드시 어노테이션 대상이다.** 라이브러리가 자체적으로 렌더링하는 내부 요소만 제외한다.

| 구분 | 어노테이션 | 이유 |
|------|-----------|------|
| 커스텀 노드/셀 컴포넌트 | **O** | 일반 JSX로 렌더링, DOM에 data-* 전달됨 |
| 라이브러리 내부 SVG (엣지, 그리드) | X | 라이브러리가 직접 렌더링, 속성 전달 불가 |
| 라이브러리 내장 컨트롤 (줌, 미니맵) | X | 줌/팬은 pointer 이벤트로 처리 가능 |

커스텀 노드의 `data-agrune-name`에는 노드의 라벨(동적 값)을 사용.

**중요: 커스텀 노드는 반드시 캔버스 컨테이너와 동일한 그룹에 소속시켜야 한다.** agrune은 그룹 단위로 캔버스 좌표 공간을 적용한다. 노드가 다른 그룹에 있으면 DOM 상 캔버스 내부에 있더라도 캔버스 좌표(`center`/`size`/`coordSpace: "canvas"`)가 제공되지 않는다. 그룹 이름/설명은 캔버스 컨테이너에만 두면 된다.

## 코드 예시: 커스텀 노드

```tsx
export function StageNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <div
      data-agrune-action="click"
      data-agrune-name={data.label}
      data-agrune-desc="스테이지 노드. 드래그하여 이동, 핸들로 연결"
      data-agrune-group="workflow-canvas"
    >
      {data.label}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
```

## data-agrune-meta 속성

캔버스 그룹에 메타데이터 제공 함수를 지정한다. 스냅샷 시 agrune이 `window[fnName]()`을 호출하여 결과를 그룹의 `meta` 필드에 포함한다.

- **위치:** `data-agrune-group`과 같은 요소에 배치
- **값:** `window`에 등록된 전역 함수 이름
- **용도:** 엣지 연결 정보, 스냅 그리드 설정 등 DOM만으로 알 수 없는 메타데이터 제공
- **viewport 정보는 포함하지 않는다:** `data-agrune-canvas`가 있으면 런타임이 내부적으로 transform을 파싱한다. meta에 viewport 정보를 넣을 필요 없음

### React Flow 훅 컨텍스트 주의

> **`useReactFlow()` 등 React Flow 훅은 `<ReactFlow>` 또는 `<ReactFlowProvider>`의 자식 컴포넌트에서만 호출할 수 있다.**
> `<ReactFlow>`를 렌더링하는 동일 컴포넌트에서 호출하면 zustand provider 에러가 발생한다.

meta 함수 등록 시 **ref 기반 접근**을 사용하면 provider 없이도 최신 상태를 참조할 수 있다:

```tsx
function WorkflowEditor() {
  const [edges, setEdges] = useEdgesState(initialEdges)
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  useEffect(() => {
    ;(window as Record<string, unknown>).getWorkflowMeta = () => ({
      edges: edgesRef.current.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    })
    return () => {
      delete (window as Record<string, unknown>).getWorkflowMeta
    }
  }, [])

  return (
    <div
      data-agrune-group="workflow-canvas"
      data-agrune-canvas=".react-flow__viewport"
      data-agrune-meta="getWorkflowMeta"
    >
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  )
}
```

**오류 처리:** 함수 미등록, 예외 발생, 직렬화 불가 시 `meta: null`로 처리. 앱 동작에 영향 없음.

## 줌/팬 조작

캔버스의 줌/팬은 agrune 런타임이 자동으로 관리한다. 노드가 viewport 밖에 있으면 드래그 시 자동 팬이 실행된다. 수동 줌/팬이 필요하면 `agrune_pointer`의 `wheel` 액션을 사용. 별도 어노테이션 불필요.
