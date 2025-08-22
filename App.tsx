/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import {
  Platform,
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import {
  WalletConnectModal,
  useWalletConnectModal,
} from '@walletconnect/modal-react-native';
import { walletConnectConfig, modalConfig } from './walletConnectConfig';

function App(): React.JSX.Element {
  const [isGoogleLoginModalVisible, setIsGoogleLoginModalVisible] =
    useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState('');
  // 구글 로그인 성공 시 받은 정보를 저장할 상태
  const [googleLoginData, setGoogleLoginData] = useState<{
    id_token: string;
    state: string;
  } | null>(null);

  // WalletConnect 상태
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const mainWebViewRef = useRef<WebView>(null);
  const {
    open,
    isConnected: modalIsConnected,
    provider,
  } = useWalletConnectModal();

  // Android 에뮬레이터에서는 10.0.2.2를 사용해야 호스트 머신의 localhost에 접근 가능
  const baseUrl =
    Platform.OS === 'android'
      ? 'http://10.0.2.2:3003'
      : 'http://localhost:3003';

  // Google OAuth 설정
  const GOOGLE_CLIENT_ID =
    '1063057034813-60kk0n3hlr20ht6e84v6orukki2atkvj.apps.googleusercontent.com';
  const GOOGLE_REDIRECT_URI = 'https://www.kvcm.io';
  const GOOGLE_SCOPE = 'openid email profile';

  // WalletConnect 연결 상태 동기화
  useEffect(() => {
    console.log('WalletConnect 연결 상태:', modalIsConnected);

    if (modalIsConnected && provider) {
      // 연결된 경우 계정 정보 가져오기
      const getAccounts = async () => {
        try {
          const accounts = (await provider.request({
            method: 'eth_accounts',
          })) as string[];

          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            console.log('지갑 연결 완료:', accounts[0]);
          }
        } catch (error) {
          console.error('계정 정보 가져오기 실패:', error);
        }
      };

      getAccounts();
    } else {
      // 연결 해제된 경우
      setWalletAddress('');
      setIsConnected(false);
      console.log('지갑 연결 해제됨');
    }
  }, [modalIsConnected, provider]);

  // 메타마스크 연결
  const connectWallet = async () => {
    try {
      const result = await open();
    } catch (error) {
      console.error('Wallet 연결 실패:', error);
      Alert.alert('연결 실패', '지갑 연결에 실패했습니다.');
    }
  };

  // 지갑 연결 해제
  const disconnectWallet = async () => {
    try {
      if (provider) {
        await provider.disconnect();
        setWalletAddress('');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('지갑 연결 해제 실패:', error);
    }
  };

  // 서명 요청
  const signMessage = async () => {
    if (!provider || !walletAddress) {
      Alert.alert('오류', '먼저 지갑을 연결해주세요.');
      return;
    }

    try {
      const message = '안녕하세요! 이 메시지에 서명해주세요.';
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      Alert.alert('서명 성공', `서명: ${signature}`);

      // 웹뷰에 서명 성공 메시지 전송
      mainWebViewRef.current?.postMessage(
        JSON.stringify({
          type: 'WALLET_SIGN_SUCCESS',
          signature: signature,
          message: message,
        })
      );
    } catch (error) {
      console.error('서명 실패:', error);
      Alert.alert('서명 실패', '메시지 서명에 실패했습니다.');
    }
  };

  // 모달 WebView로 Google 로그인 열기
  const openGoogleLoginWithModal = (url: string) => {
    setGoogleAuthUrl(url);
    setIsGoogleLoginModalVisible(true);
  };

  // Google 로그인 시작 (Modal WebView 사용)
  const startGoogleLogin = async () => {
    try {
      // Google OAuth URL 생성 (id_token 직접 받기)
      const state = Math.random().toString(36).substring(7);
      const nonce = Math.random().toString(36).substring(7);
      const googleOAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent(GOOGLE_SCOPE)}` +
        `&state=${state}` +
        `&nonce=${nonce}` +
        `&prompt=consent`;

      openGoogleLoginWithModal(googleOAuthUrl);
    } catch (error) {
      console.error('Google 로그인 시작 실패:', error);
      mainWebViewRef.current?.postMessage(
        JSON.stringify({
          type: 'GOOGLE_LOGIN_ERROR',
          error: 'Google 로그인을 시작할 수 없습니다.',
        })
      );
    }
  };

  // 구글 로그인 모달 닫기
  const closeGoogleLoginModal = () => {
    setIsGoogleLoginModalVisible(false);
  };

  // Google OAuth 성공 처리
  const handleGoogleOAuthSuccess = async (id_token: string, state: string) => {
    try {
      // 웹뷰에 Google 로그인 성공 메시지 전송
      mainWebViewRef.current?.postMessage(
        JSON.stringify({
          type: 'GOOGLE_LOGIN_SUCCESS',
          id_token: id_token,
          state: state,
        })
      );

      closeGoogleLoginModal();
    } catch (error) {
      console.error('Google OAuth 성공 처리 실패:', error);

      handleGoogleOAuthError('server_error');
    }
  };

  // Google OAuth 오류 처리
  const handleGoogleOAuthError = (error: string) => {
    console.error('Google OAuth 오류:', error);

    // 오류 메시지를 웹뷰에 전송
    mainWebViewRef.current?.postMessage(
      JSON.stringify({
        type: 'GOOGLE_LOGIN_ERROR',
        error: error,
      })
    );

    // 구글 로그인 데이터 상태도 초기화
    setGoogleLoginData(null);

    // 모달 닫기
    closeGoogleLoginModal();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={mainWebViewRef}
        source={{ uri: `${baseUrl}` }}
        style={styles.webview}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
      />

      {/* WalletConnect 지갑 연결 버튼 */}
      <View style={styles.walletButtons}>
        {!isConnected ? (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={connectWallet}
          >
            <Text style={styles.buttonText}>지갑 연결</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.connectedButtons}>
            <TouchableOpacity style={styles.signButton} onPress={signMessage}>
              <Text style={styles.buttonText}>메시지 서명</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnectWallet}
            >
              <Text style={styles.buttonText}>연결 해제</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 지갑 주소 표시 */}
      {walletAddress && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>
            연결된 지갑: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </Text>
        </View>
      )}

      {/* 구글 로그인 모달 */}
      <Modal
        visible={isGoogleLoginModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeGoogleLoginModal}
        transparent={false}
        hardwareAccelerated={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>구글 로그인</Text>
            <TouchableOpacity
              onPress={closeGoogleLoginModal}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <WebView
            source={{
              uri: googleAuthUrl,
            }}
            style={styles.modalWebview}
            originWhitelist={['*']}
            mixedContentMode="always"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            // 403 오류 방지를 위한 추가 설정
            userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            // 추가 보안 설정
            allowsBackForwardNavigationGestures={false}
            allowsLinkPreview={false}
            // 쿠키 및 캐시 설정
            sharedCookiesEnabled={true}
            cacheEnabled={true}
            onNavigationStateChange={navState => {
              // Google OAuth 콜백 URL 감지
              if (navState.url.includes('www.kvcm.io')) {
                // URL에서 파라미터 추출 (Hermes 호환) - 해시와 쿼리 모두 처리
                const params: { [key: string]: string } = {};

                // 해시 파라미터 처리 (# 이후)
                const hashPart = navState.url.split('#')[1] || '';
                if (hashPart) {
                  hashPart.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    if (key && value) {
                      params[decodeURIComponent(key)] =
                        decodeURIComponent(value);
                    }
                  });
                }

                // 쿼리 파라미터 처리 (? 이후)
                const queryPart = navState.url.split('?')[1] || '';
                if (queryPart) {
                  const queryWithoutHash = queryPart.split('#')[0];
                  queryWithoutHash.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    if (key && value) {
                      params[decodeURIComponent(key)] =
                        decodeURIComponent(value);
                    }
                  });
                }

                const id_token = params['id_token'];
                const state = params['state'];

                if (id_token) {
                  handleGoogleOAuthSuccess(id_token, state);
                }
              }
            }}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onHttpError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
            }}
          />
        </View>
      </Modal>

      {/* WalletConnect Modal */}
      <WalletConnectModal
        projectId={modalConfig.projectId}
        providerMetadata={{
          name: 'Mobile App',
          description: 'Mobile App with WalletConnect',
          url: 'https://your-app.com',
          icons: ['https://your-app.com/icon.png'],
          redirect: {
            native: 'your-app://',
            universal: 'https://your-app.com',
          },
        }}
        explorerRecommendedWalletIds={[
          'c57ca95b47569778a828d19178114f4db188b89b',
        ]}
        explorerExcludedWalletIds="ALL"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  walletButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  connectedButtons: {
    gap: 8,
  },
  signButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addressContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 1000,
  },
  addressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    // 모달 내 웹뷰 성능 최적화
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalWebview: {
    flex: 1,
  },
  testButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;
