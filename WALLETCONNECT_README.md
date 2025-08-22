# WalletConnect 메타마스크 연동 가이드

이 프로젝트는 WalletConnect를 사용하여 메타마스크와 연동하는 React Native 앱입니다.

## 설치된 패키지

- `@walletconnect/modal-react-native`: WalletConnect 모달 UI
- `@walletconnect/react-native-compat`: React Native 호환성

## 설정 방법

### 1. WalletConnect Cloud 프로젝트 생성

1. [WalletConnect Cloud](https://cloud.walletconnect.com/)에 접속
2. 새 프로젝트 생성
3. 프로젝트 ID 복사

### 2. 설정 파일 수정

`walletConnectConfig.ts` 파일에서 다음을 수정하세요:

```typescript
export const walletConnectConfig = {
  projectId: 'YOUR_PROJECT_ID', // WalletConnect Cloud에서 받은 프로젝트 ID로 변경
  // ... 기타 설정
};
```

### 3. 앱 정보 수정

`App.tsx`에서 다음 정보를 수정하세요:

```typescript
providerMetadata={{
  name: 'Your App Name', // 앱 이름
  description: 'Your App Description', // 앱 설명
  url: 'https://your-app.com', // 앱 URL
  icons: ['https://your-app.com/icon.png'], // 앱 아이콘
  redirect: {
    native: 'your-app://', // 네이티브 스킴
    universal: 'https://your-app.com', // 유니버설 링크
  },
}}
```

## 주요 기능

### 1. 지갑 연결
- "지갑 연결" 버튼을 탭하면 WalletConnect 모달이 열립니다
- 메타마스크를 선택하여 연결할 수 있습니다

### 2. 메시지 서명
- 지갑이 연결된 후 "메시지 서명" 버튼이 활성화됩니다
- 사용자 정의 메시지에 서명을 요청할 수 있습니다

### 3. 연결 해제
- "연결 해제" 버튼으로 지갑 연결을 해제할 수 있습니다

## 사용된 기술

- **WalletConnect v2**: 최신 버전의 WalletConnect 프로토콜
- **React Native**: 크로스 플랫폼 모바일 앱 개발
- **TypeScript**: 타입 안전성 보장

## 주의사항

1. **프로젝트 ID**: 반드시 WalletConnect Cloud에서 발급받은 프로젝트 ID를 사용해야 합니다
2. **네트워크 설정**: 현재 Ethereum Mainnet(체인 ID: 1)으로 설정되어 있습니다
3. **앱 스킴**: 네이티브 앱 스킴을 올바르게 설정해야 합니다

## 문제 해결

### 지갑 연결이 안 되는 경우
1. 프로젝트 ID가 올바른지 확인
2. 네트워크 연결 상태 확인
3. 메타마스크 앱이 설치되어 있는지 확인

### 서명이 실패하는 경우
1. 지갑이 올바르게 연결되어 있는지 확인
2. 메타마스크에서 서명 요청을 승인했는지 확인

## 추가 개발

이 기본 구현을 바탕으로 다음과 같은 기능을 추가할 수 있습니다:

- 트랜잭션 전송
- 스마트 컨트랙트 상호작용
- 다중 체인 지원
- 사용자 인증 및 세션 관리
