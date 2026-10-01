# GeumjeongNightSchool

금정열림배움터에서 글공부하시는 어르신들과 가르치는 선생님들이 함께 사용하기 위해 만든 앱입니다. 모바일 앱과 서버 코드를 함께 보관합니다.

| 경로 | 내용 | 출처 |
| --- | --- | --- |
| `frontend/` | Expo SDK 52, React Native 앱 | 공동 저장소 `frontend-dev` 브랜치의 앱 코드와 로컬 빌드 수정 |
| `backend/` | NestJS 로그인·달력 API | 공동 저장소 `backend` 브랜치 |
| `libs/` | 달력·수업 등의 공유 타입 | 공동 저장소 `backend` 브랜치 |
| `notice-board-backend/` | 별도의 NestJS 게시판·댓글 API | 공동 저장소 `backend-byunggil` 브랜치 |

공동 저장소의 여러 브랜치에 있던 코드를 한곳에 모았습니다. 두 서버는 별도 서비스이며, 프론트엔드의 일부 화면은 아직 로컬 목 데이터를 사용합니다. 서버 코드가 포함되어 있어도 앱의 모든 기능이 서버에 연결된 상태는 아닙니다.

## 모바일 앱 실행

Node.js 20 이상, Xcode 및 CocoaPods가 필요합니다. iOS 시뮬레이터 빌드를 확인한 앱은 `frontend/`에 있습니다.

```sh
cd frontend
npm ci
cd ios && pod install && cd ..
npm run ios
```

Xcode에서 직접 실행할 때는 `frontend/ios/GeumjeongyahakFront.xcworkspace`를 엽니다. Metro가 필요하면 `frontend/`에서 `npm start`를 실행합니다. API 연결 시 `frontend/.env`에 `EXPO_PUBLIC_API_URL`을 설정합니다.

## 로그인·달력 API

PostgreSQL을 준비하고 저장소 루트에서 다음을 실행합니다.

```sh
npm ci
npm run build
cd backend
DATABASE_HOST=localhost DATABASE_PORT=5432 DATABASE_USER=your_user DATABASE_PASSWORD=your_password JWT_SECRET=change_me npm start
```

기본 포트는 `3000`입니다. 실제 설정값은 로컬 `.env`로 관리하고 Git에 올리지 않습니다. `backend/data/`에는 원본의 초기 데이터가 들어 있습니다. 서비스가 해당 파일을 읽을 때 현재 작업 디렉터리는 `backend/`여야 합니다.

## 게시판 API

게시판은 별도 서버이며 기본 포트는 `3001`입니다. 별도의 PostgreSQL 데이터베이스를 지정하세요.

```sh
cd notice-board-backend
npm ci
npm run build
DATABASE_HOST=localhost DATABASE_PORT=5432 DATABASE_USER=your_user DATABASE_PASSWORD=your_password DATABASE_NAME=your_database npm run start:prod
```

`notice-board-backend/README.md`에는 원본의 API 요청 예제가 있습니다. 서버 설정은 데이터베이스 전체 삭제를 수행하지 않도록 수정했습니다.
