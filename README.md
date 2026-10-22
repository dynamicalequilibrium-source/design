# 업무 바통

가상 업무 위키에서 문장을 선택하고 질문·답변·댓글을 남기는 로컬 시제품입니다. 기존 React/Vite 화면을 유지하며, 설계계획서 v0.4의 첫 기능 단위를 FastAPI와 SQLite까지 연결했습니다. **전체 P0/MVP 완료 상태는 아닙니다.**

## 실행

Node.js 22.12 이상, Python 3.12 이상을 사용합니다. 프런트엔드는 npm과 `package-lock.json`을 기준으로 관리합니다.

```sh
npm ci
python -m venv .venv
. .venv/bin/activate
pip install -r server/requirements.txt
python -m uvicorn server.app:app --host 127.0.0.1 --port 8000
```

다른 터미널에서 실행합니다.

```sh
npm run dev
```

브라우저에서 http://127.0.0.1:3000 을 엽니다. Vite가 `/api` 요청을 로컬 API 서버로 전달합니다. DB는 최초 요청 때 `server/data/baton.sqlite3`에 생성됩니다. `BATON_DB`로 다른 경로를 지정할 수 있습니다. 기존 질문은 처음에 가상 데이터로 채우며 이후 작성 내용을 덮어쓰지 않습니다.

## 확인할 흐름

1. 본문 문장 또는 문단 질문 버튼을 선택합니다.
2. 연결된 질문을 선택하거나 ‘새 질문 등록’에서 작성합니다.
3. 답변과 댓글을 등록하고 새로고침합니다. 서버에 저장한 내용이 유지됩니다.
4. 작성 중 새로고침하면 해당 문장에 질문 제목·내용·답변 초안이 복원됩니다.
5. 닫기 또는 Escape를 누르면 본문으로 돌아갑니다.

초안은 현재 브라우저의 샘플 사용자 영역에만 저장됩니다. 질문·답변·댓글은 SQLite에 저장됩니다. 저장 실패 시 성공한 것처럼 표시하거나 입력을 비우지 않습니다. 질문 재시도는 같은 요청 키를 재사용합니다.

## 검증

```sh
npm run lint
npm run build
pip install -r server/requirements-test.txt
npm run test:api
```

브라우저 회귀 검사는 Playwright와 Chromium을 설치한 뒤 별도의 테스트 DB로 API 서버와 Vite를 실행하고 수행합니다. 테스트는 질문·답변·댓글을 실제로 작성하므로 시연용 DB와 분리해 실행합니다.

```sh
BATON_DB=/tmp/baton-browser-test.sqlite3 python -m uvicorn server.app:app --host 127.0.0.1 --port 8000
# 다른 터미널: npm run dev
python tests/browser_flow.py
```

Chromium 실행 파일 기본값은 `/usr/bin/chromium`이며 다른 경로는 `BATON_CHROMIUM` 환경변수로 지정합니다. 전체 결과는 [테스트 기록](docs/test-results.md)을 참고하세요.

## 현재 범위

- 문서·문단·문장 범위에 연결한 질문을 여러 개 보존합니다.
- 서버가 원문 인용과 문단 관계를 검사하고 문서 버전과 코드 포인트 범위를 기록합니다.
- 새 답변에 검토 완료 배지를 자동 부여하지 않습니다. 자유 입력한 근거는 검증된 출처와 구별합니다.
- 서버가 발급한 샘플 세션과 CSRF 토큰을 사용합니다. 샘플 사용자는 하나이며 모든 샘플 문서를 공유합니다.

문서별 역할·접근권한, 정식 인증, 편집·검토·게시, 파일 업로드·실제 원문 뷰어, AI 초안 생성은 아직 구현하지 않았습니다. 실제 내부자료를 넣거나 외부에 공개 배포하지 마세요. 자세한 범위는 [알려진 한계](docs/known-limitations.md)와 [설계 결정](docs/decisions.md)에 기록했습니다.
