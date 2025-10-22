import { CryptoAsset } from '../types';

export const CRYPTO_ASSET_LABELS: Record<CryptoAsset, string> = {
  [CryptoAsset.USDT_TRC20]: 'USDT (TRC20)',
  [CryptoAsset.USDT_ERC20]: 'USDT (ERC20)',
  [CryptoAsset.BTC]: 'Bitcoin',
  [CryptoAsset.ETH]: 'Ethereum',
};

export function getAssetLabel(asset: CryptoAsset): string {
  return CRYPTO_ASSET_LABELS[asset] || asset;
}

