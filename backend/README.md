# 로그인·달력 API

NestJS, TypeORM, PostgreSQL을 사용하는 금정나이트스쿨 서버입니다. 설치와 실행 방법은 [저장소 안내](../README.md#로그인달력-api)를 참고하세요.

루트에서 `npm ci`와 `npm run build`를 실행하면 `libs/`의 공유 타입을 먼저 빌드합니다. 서버는 `backend/` 디렉터리에서 실행해야 `data/initial-data.json`을 찾을 수 있습니다.

환경 변수 `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `JWT_SECRET`, `PORT`를 로컬에서 설정하세요. 비밀번호나 `.env` 파일을 Git에 추가하지 마세요.
