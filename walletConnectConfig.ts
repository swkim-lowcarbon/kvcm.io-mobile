import { WalletConnectModal } from '@walletconnect/modal-react-native';

export const walletConnectConfig = {
  projectId: 'dd7fba3764fcb3e524663dfa87ed04a5',
  metadata: {
    name: 'Climate Foundation',
    description: 'Climate Foundation',
    url: 'https://www.kvcm.io',
    icons: ['https://www.kvcm.io/favicon.ico'],
  },
  chains: [1], // Ethereum Mainnet
  walletConnectVersion: 2,
};

export const modalConfig = {
  projectId: walletConnectConfig.projectId,
  chains: walletConnectConfig.chains,
  enableAnalytics: true,
  enableExplorer: true,
  explorerRecommendedWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b'], // 메타마스크만
  explorerExcludedWalletIds: 'ALL', // 다른 모든 지갑 제외
  termsOfServiceUrl: 'https://www.kvcm.io/terms',
  privacyPolicyUrl: 'https://www.kvcm.io/privacy',
};
