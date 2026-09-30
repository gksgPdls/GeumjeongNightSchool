# 금정야학 프론트엔드

Expo SDK 52와 React Native로 만든 iOS·Android 앱입니다.

## iOS 시뮬레이터에서 실행

Node.js 18.18 이상, Xcode, CocoaPods가 필요합니다.

```sh
npm ci
cd ios && pod install && cd ..
npm run ios
```

Xcode에서 직접 실행할 때는 `ios/GeumjeongyahakFront.xcworkspace`를 열고 시뮬레이터를 선택한 뒤 Run을 누릅니다. 개발 중에는 프로젝트 폴더에서 `npm start`로 Metro를 실행합니다.

현재 테스트 로그인 버튼은 서버 인증 없이 메인 화면으로 이동합니다. API 요청을 시험하려면 `.env`에 `EXPO_PUBLIC_API_URL`을 설정하고 백엔드 서버를 별도로 실행해야 합니다.
