import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Linking, Platform, Pressable, StatusBar, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import mobileAds, { AdEventType, AdsConsent, BannerAd, BannerAdSize, InterstitialAd, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'react-native-iap';
import gameHtml from './generated/game-html';
import { AD_POLICY_CONFIG, getAdUnitId } from './ads.config';
import { createAdPolicy } from './adPolicy';
import { IAP_PRODUCTS, IAP_SKUS, findIapProductById } from './iap.config';

const SAVE_KEY = 'devre_mimari_save_v1';
const AD_FREE_KEY = 'devre_mimari_ad_free_v1';
const PROCESSED_TX_KEY = 'devre_mimari_processed_tx_v1';
const IAP_WATCHDOG_MS = 20000;

const BACK_SCRIPT = `(() => {
  const modalOpen = [...document.querySelectorAll('[id$="-modal"]')].some(el => !el.classList.contains('hidden'));
  if (!modalOpen && !document.getElementById('main-menu-overlay').classList.contains('hidden')) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'exit'}));
  } else window.dispatchEvent(new PopStateEvent('popstate'));
})(); true;`;

const BANNER_UNIT_ID = getAdUnitId(Platform.OS, 'banner');
const INTERSTITIAL_UNIT_ID = getAdUnitId(Platform.OS, 'interstitial');
const REWARDED_UNIT_ID = getAdUnitId(Platform.OS, 'rewarded');

function isPurchasedState(purchase) {
  return (!purchase?.purchaseState || purchase.purchaseState === 'purchased') && !purchase?.revocationDateIOS;
}

function getTxKey(purchase, sku) {
  return purchase?.id || purchase?.purchaseToken || `${sku}:${purchase?.transactionDate || ''}`;
}

function Game() {
  const webview = useRef(null);
  const webViewLoadedRef = useRef(false);
  const mountedRef = useRef(true);
  const saveQueue = useRef(Promise.resolve());
  const saveWarningShown = useRef(false);
  const adPolicyRef = useRef(createAdPolicy(AD_POLICY_CONFIG));
  const interstitialRef = useRef(null);
  const interstitialCleanupRef = useRef(null);
  const interstitialLoadingRef = useRef(false);
  const interstitialLoadedRef = useRef(false);
  const interstitialShowingRef = useRef(false);
  const rewardedRef = useRef(null);
  const rewardedCleanupRef = useRef(null);
  const rewardedLoadingRef = useRef(false);
  const rewardedLoadedRef = useRef(false);
  const rewardedShowingRef = useRef(false);
  const rewardedPendingTypeRef = useRef(null);
  const rewardedEarnedRef = useRef(false);
  const adsInitStartedRef = useRef(false);
  const adsInitializedRef = useRef(false);
  const initAdsRef = useRef(null);
  const privacyOptionsRequiredRef = useRef(false);

  const iapReadyRef = useRef(false);
  const iapInitPromiseRef = useRef(null);
  const iapListenersAttachedRef = useRef(false);
  const iapUpdateSubRef = useRef(null);
  const iapErrorSubRef = useRef(null);
  const iapBusyRef = useRef(false);
  const iapWatchdogRef = useRef(null);
  const iapPricesRef = useRef({});
  const adFreeRef = useRef(false);
  const processedTxRef = useRef(new Set());
  const pendingConsumablesRef = useRef([]);

  const [adFree, setAdFree] = useState(false);
  const [adsReady, setAdsReady] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);
  const [initialSave, setInitialSave] = useState(undefined);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);

  const clearIapWatchdog = useCallback(() => {
    if (iapWatchdogRef.current) {
      clearTimeout(iapWatchdogRef.current);
      iapWatchdogRef.current = null;
    }
  }, []);

  const pushIapStateToWebView = useCallback((overrides = {}) => {
    const payload = {
      adFree: typeof overrides.adFree === 'boolean' ? overrides.adFree : adFreeRef.current,
      busy: typeof overrides.busy === 'boolean' ? overrides.busy : iapBusyRef.current,
      prices: overrides.prices || iapPricesRef.current,
    };
    if (typeof overrides.message === 'string') {
      payload.message = overrides.message;
    }
    const serialized = JSON.stringify(payload).replace(/</g, '\\u003c');
    webview.current?.injectJavaScript(`if (typeof window.__onNativeIapState === 'function') window.__onNativeIapState(${serialized}); true;`);
  }, []);

  const grantWattsToWebView = useCallback((amount, label) => {
    const safeLabel = JSON.stringify(label || '').replace(/</g, '\\u003c');
    webview.current?.injectJavaScript(`if (typeof window.__onNativeWattGrant === 'function') window.__onNativeWattGrant(${Number(amount) || 0}, ${safeLabel}); true;`);
  }, []);

  const setWebViewPaused = useCallback((paused) => {
    webview.current?.injectJavaScript(`
      window.__nativePaused = ${paused ? 'true' : 'false'};
      if (typeof sfx !== 'undefined') {
        if (typeof sfx.syncAmbient === 'function') sfx.syncAmbient();
        if (sfx.ctx) {
          if (window.__nativePaused) sfx.ctx.suspend().catch(() => {});
          else if (sfx.enabled) sfx.ctx.resume().catch(() => {});
        }
      }
      true;
    `);
  }, []);

  const cleanupInterstitial = useCallback(() => {
    if (interstitialCleanupRef.current) {
      interstitialCleanupRef.current();
      interstitialCleanupRef.current = null;
    }
    interstitialRef.current = null;
  }, []);

  const cleanupRewarded = useCallback(() => {
    if (rewardedCleanupRef.current) {
      rewardedCleanupRef.current();
      rewardedCleanupRef.current = null;
    }
    rewardedRef.current = null;
  }, []);

  const preloadRewarded = useCallback(() => {
    if (!adsInitializedRef.current) return;
    if (rewardedShowingRef.current || rewardedLoadingRef.current || rewardedLoadedRef.current) return;
    cleanupRewarded();
    rewardedLoadingRef.current = true;
    rewardedLoadedRef.current = false;

    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoadingRef.current = false;
      rewardedLoadedRef.current = true;
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardedEarnedRef.current = true;
    });
    const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      rewardedShowingRef.current = true;
      rewardedLoadedRef.current = false;
      setWebViewPaused(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      const earned = rewardedEarnedRef.current;
      const rType = rewardedPendingTypeRef.current;
      rewardedShowingRef.current = false;
      rewardedLoadedRef.current = false;
      rewardedLoadingRef.current = false;
      rewardedEarnedRef.current = false;
      rewardedPendingTypeRef.current = null;
      if (!interstitialShowingRef.current && !rewardedShowingRef.current && AppState.currentState === 'active') {
        setWebViewPaused(false);
      }
      if (earned && rType) {
        const safeType = JSON.stringify(rType).replace(/</g, '\\u003c');
        webview.current?.injectJavaScript(`if (typeof window.__onNativeRewardEarned === 'function') window.__onNativeRewardEarned(${safeType}); true;`);
      }
      cleanupRewarded();
      preloadRewarded();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      rewardedShowingRef.current = false;
      rewardedLoadedRef.current = false;
      rewardedLoadingRef.current = false;
      rewardedEarnedRef.current = false;
      rewardedPendingTypeRef.current = null;
      cleanupRewarded();
    });

    rewardedCleanupRef.current = () => {
      unsubLoaded();
      unsubEarned();
      unsubOpened();
      unsubClosed();
      unsubError();
    };
    rewardedRef.current = ad;
    ad.load();
  }, [cleanupRewarded, setWebViewPaused]);

  const tryShowRewarded = useCallback(async (rewardType) => {
    if (rewardedShowingRef.current || interstitialShowingRef.current) return;
    if (!adsInitializedRef.current && initAdsRef.current) {
      await initAdsRef.current();
    }
    if (!rewardedLoadedRef.current || !rewardedRef.current) {
      preloadRewarded();
      webview.current?.injectJavaScript(`if (typeof window.__onNativeRewardFailed === 'function') window.__onNativeRewardFailed('Video henüz hazır değil, biraz sonra tekrar dene.'); true;`);
      return;
    }
    rewardedEarnedRef.current = false;
    rewardedPendingTypeRef.current = rewardType;
    rewardedLoadedRef.current = false;
    Promise.resolve(rewardedRef.current.show()).catch(() => {
      rewardedShowingRef.current = false;
      rewardedPendingTypeRef.current = null;
      cleanupRewarded();
      preloadRewarded();
      webview.current?.injectJavaScript(`if (typeof window.__onNativeRewardFailed === 'function') window.__onNativeRewardFailed('Video açılamadı, lütfen tekrar dene.'); true;`);
    });
  }, [cleanupRewarded, preloadRewarded]);

  const preloadInterstitial = useCallback(() => {
    if (adFreeRef.current || !adsInitializedRef.current) return;
    if (interstitialShowingRef.current || interstitialLoadingRef.current || interstitialLoadedRef.current) return;
    cleanupInterstitial();
    interstitialLoadingRef.current = true;
    interstitialLoadedRef.current = false;

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadingRef.current = false;
      interstitialLoadedRef.current = true;
    });
    const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      interstitialShowingRef.current = true;
      interstitialLoadedRef.current = false;
      adPolicyRef.current.markShown();
      setWebViewPaused(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialShowingRef.current = false;
      interstitialLoadedRef.current = false;
      interstitialLoadingRef.current = false;
      if (!interstitialShowingRef.current && !rewardedShowingRef.current && AppState.currentState === 'active') {
        setWebViewPaused(false);
      }
      cleanupInterstitial();
      preloadInterstitial();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialShowingRef.current = false;
      interstitialLoadedRef.current = false;
      interstitialLoadingRef.current = false;
      cleanupInterstitial();
    });

    interstitialCleanupRef.current = () => {
      unsubLoaded();
      unsubOpened();
      unsubClosed();
      unsubError();
    };
    interstitialRef.current = ad;
    ad.load();
  }, [cleanupInterstitial, setWebViewPaused]);

  const pushPrivacyStateToWebView = useCallback((required) => {
    if (typeof required === 'boolean') {
      privacyOptionsRequiredRef.current = required;
    }
    if (!webViewLoadedRef.current || !webview.current) return;
    const payload = JSON.stringify({ required: !!privacyOptionsRequiredRef.current });
    webview.current.injectJavaScript(
      `window.__onNativePrivacyState && window.__onNativePrivacyState(${payload}); true;`
    );
  }, []);

  const openPrivacyOptionsForm = useCallback(async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
      const updated = await AdsConsent.requestInfoUpdate().catch(() => null);
      if (updated) {
        pushPrivacyStateToWebView(updated.privacyOptionsRequirementStatus === 'REQUIRED');
      }
    } catch {}
  }, [pushPrivacyStateToWebView]);

  const initAdsIfNeeded = useCallback(async () => {
    if (adsInitializedRef.current) {
      if (!mountedRef.current) return;
      if (!adFreeRef.current) {
        setAdsReady(true);
        setBannerKey(k => k + 1);
        preloadInterstitial();
      }
      preloadRewarded();
      return;
    }
    if (adsInitStartedRef.current) return;
    adsInitStartedRef.current = true;
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate().catch(() => null);
      const afterForm = await AdsConsent.loadAndShowConsentFormIfRequired().catch(() => consentInfo);
      const finalInfo = afterForm || consentInfo;
      pushPrivacyStateToWebView(finalInfo?.privacyOptionsRequirementStatus === 'REQUIRED');
      await mobileAds().initialize();
      adsInitializedRef.current = true;
      if (!mountedRef.current) return;
      preloadRewarded();
      if (!adFreeRef.current) {
        setAdsReady(true);
        preloadInterstitial();
      }
    } catch {
      adsInitStartedRef.current = false;
    }
  }, [preloadInterstitial, preloadRewarded, pushPrivacyStateToWebView]);
  initAdsRef.current = initAdsIfNeeded;

  const persistAdFree = useCallback(async (enabled) => {
    adFreeRef.current = enabled;
    if (mountedRef.current) setAdFree(enabled);
    if (enabled) {
      cleanupInterstitial();
      interstitialLoadedRef.current = false;
      interstitialLoadingRef.current = false;
      if (mountedRef.current) setBannerLoaded(false);
    } else {
      void initAdsIfNeeded();
    }
    try { await AsyncStorage.setItem(AD_FREE_KEY, enabled ? '1' : '0'); } catch {}
    pushIapStateToWebView({ adFree: enabled });
  }, [cleanupInterstitial, cleanupRewarded, initAdsIfNeeded, pushIapStateToWebView]);

  const recordProcessedTx = useCallback(async (txKey) => {
    if (!txKey) return;
    processedTxRef.current.add(txKey);
    const list = Array.from(processedTxRef.current).slice(-200);
    processedTxRef.current = new Set(list);
    try { await AsyncStorage.setItem(PROCESSED_TX_KEY, JSON.stringify(list)); } catch {}
  }, []);

  const deliverConsumablePurchase = useCallback(async (purchase, product) => {
    const txKey = getTxKey(purchase, product.id);
    if (!webViewLoadedRef.current || !webview.current) {
      if (!pendingConsumablesRef.current.some(item => getTxKey(item.purchase, item.product.id) === txKey)) {
        pendingConsumablesRef.current.push({ purchase, product });
      }
      pushIapStateToWebView({ busy: false });
      return false;
    }
    let granted = false;
    if (!processedTxRef.current.has(txKey)) {
      await recordProcessedTx(txKey);
      grantWattsToWebView(product.wattAmount, product.title);
      pushIapStateToWebView({ busy: false, message: `⚡ +${product.wattAmount} W hesabına eklendi! (${product.title})` });
      granted = true;
    } else {
      pushIapStateToWebView({ busy: false, message: '' });
    }
    try {
      await finishTransaction({ purchase, isConsumable: true });
    } catch {}
    return granted;
  }, [grantWattsToWebView, pushIapStateToWebView, recordProcessedTx]);

  const flushPendingConsumables = useCallback(async () => {
    if (!webViewLoadedRef.current || !webview.current || pendingConsumablesRef.current.length === 0) return;
    const queue = pendingConsumablesRef.current.splice(0);
    for (const item of queue) {
      await deliverConsumablePurchase(item.purchase, item.product);
    }
  }, [deliverConsumablePurchase]);

  const processPurchase = useCallback(async (purchase) => {
    clearIapWatchdog();
    const sku = purchase?.productId;
    const product = findIapProductById(sku);
    if (!product) {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: '' });
      return;
    }

    if (purchase?.revocationDateIOS) {
      iapBusyRef.current = false;
      if (product.id === IAP_PRODUCTS.remove_ads.id) {
        await persistAdFree(false);
      }
      try { await finishTransaction({ purchase, isConsumable: product.isConsumable }); } catch {}
      pushIapStateToWebView({ busy: false, message: '' });
      return;
    }

    if (purchase.purchaseState === 'pending') {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: 'Ödeme onayı bekleniyor. Onaylandığında otomatik olarak hesabına eklenecek.' });
      return;
    }
    if (!isPurchasedState(purchase)) {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: '' });
      return;
    }

    try {
      if (product.id === IAP_PRODUCTS.remove_ads.id) {
        await persistAdFree(true);
        if (purchase.isAcknowledgedAndroid !== true) {
          try { await finishTransaction({ purchase, isConsumable: false }); } catch {}
        }
        iapBusyRef.current = false;
        pushIapStateToWebView({ adFree: true, busy: false, message: '✅ Reklamlar kalıcı olarak kaldırıldı!' });
      } else if (product.wattAmount > 0) {
        iapBusyRef.current = false;
        await deliverConsumablePurchase(purchase, product);
      }
    } catch {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: 'Satın alma işlenirken sorun oluştu. Lütfen tekrar dene.' });
    }
  }, [clearIapWatchdog, deliverConsumablePurchase, persistAdFree, pushIapStateToWebView]);

  const reconcilePurchases = useCallback(async () => {
    if (!iapReadyRef.current) return { ok: false, ownsAdFree: adFreeRef.current, recoveredWatts: 0 };
    const existing = await getAvailablePurchases();
    if (!Array.isArray(existing)) return { ok: false, ownsAdFree: adFreeRef.current, recoveredWatts: 0 };

    let ownsAdFree = false;
    let recoveredWatts = 0;

    for (const purchase of existing) {
      if (!isPurchasedState(purchase)) continue;
      const product = findIapProductById(purchase.productId);
      if (!product) continue;
      if (product.id === IAP_PRODUCTS.remove_ads.id) {
        ownsAdFree = true;
        if (purchase.isAcknowledgedAndroid !== true) {
          try { await finishTransaction({ purchase, isConsumable: false }); } catch {}
        }
      } else if (product.wattAmount > 0) {
        const granted = await deliverConsumablePurchase(purchase, product);
        if (granted) recoveredWatts += product.wattAmount;
      }
    }

    if (ownsAdFree !== adFreeRef.current) {
      await persistAdFree(ownsAdFree);
    }
    return { ok: true, ownsAdFree, recoveredWatts };
  }, [deliverConsumablePurchase, persistAdFree]);

  const ensureIapReady = useCallback(async () => {
    if (iapReadyRef.current) {
      if (Object.keys(iapPricesRef.current).length < IAP_SKUS.length) {
        const products = await fetchProducts({ skus: IAP_SKUS, type: 'in-app' }).catch(() => []);
        if (mountedRef.current && Array.isArray(products) && products.length > 0) {
          const prices = { ...iapPricesRef.current };
          products.forEach((p) => {
            const id = p.id || p.productId;
            if (id && p.displayPrice) prices[id] = p.displayPrice;
          });
          iapPricesRef.current = prices;
          pushIapStateToWebView({ prices });
        }
      }
      return true;
    }
    if (iapInitPromiseRef.current) return iapInitPromiseRef.current;

    iapInitPromiseRef.current = (async () => {
      try {
        const connected = await initConnection();
        if (!mountedRef.current || !connected) return false;
        iapReadyRef.current = true;

        if (!iapListenersAttachedRef.current) {
          iapListenersAttachedRef.current = true;
          iapUpdateSubRef.current = purchaseUpdatedListener((purchase) => {
            void processPurchase(purchase);
          });
          iapErrorSubRef.current = purchaseErrorListener((err) => {
            clearIapWatchdog();
            iapBusyRef.current = false;
            const msg = isUserCancelledError(err)
              ? 'Satın alma iptal edildi.'
              : 'Mağaza işlemi tamamlanamadı. Lütfen tekrar dene.';
            pushIapStateToWebView({ busy: false, message: msg });
          });
        }

        const products = await fetchProducts({ skus: IAP_SKUS, type: 'in-app' }).catch(() => []);
        if (mountedRef.current && Array.isArray(products)) {
          const prices = { ...iapPricesRef.current };
          products.forEach((p) => {
            const id = p.id || p.productId;
            if (id && p.displayPrice) prices[id] = p.displayPrice;
          });
          iapPricesRef.current = prices;
          pushIapStateToWebView({ prices });
        }

        await reconcilePurchases().catch(() => {});
        return true;
      } catch {
        return false;
      } finally {
        iapInitPromiseRef.current = null;
      }
    })();

    return iapInitPromiseRef.current;
  }, [clearIapWatchdog, processPurchase, pushIapStateToWebView, reconcilePurchases]);

  const tryShowInterstitial = useCallback(() => {
    if (adFreeRef.current || !adsReady || interstitialShowingRef.current || rewardedShowingRef.current) return;
    if (!adPolicyRef.current.isEligible()) return;
    if (!interstitialLoadedRef.current || !interstitialRef.current) {
      preloadInterstitial();
      return;
    }
    interstitialLoadedRef.current = false;
    Promise.resolve(interstitialRef.current.show()).catch(() => {
      interstitialShowingRef.current = false;
      cleanupInterstitial();
      preloadInterstitial();
    });
  }, [adsReady, cleanupInterstitial, preloadInterstitial]);

  // AdMob başlatma (reklamsız ise atlanır)
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const storedAdFree = await AsyncStorage.getItem(AD_FREE_KEY);
        if (!mountedRef.current) return;
        if (storedAdFree === '1') {
          adFreeRef.current = true;
          setAdFree(true);
          pushIapStateToWebView({ adFree: true });
        }
        await initAdsIfNeeded();
      } catch {}
    })();
    return () => {
      mountedRef.current = false;
      cleanupInterstitial();
      cleanupRewarded();
    };
  }, [cleanupInterstitial, cleanupRewarded, initAdsIfNeeded, pushIapStateToWebView]);

  // IAP başlatma
  useEffect(() => {
    (async () => {
      try {
        const rawTx = await AsyncStorage.getItem(PROCESSED_TX_KEY);
        if (rawTx) {
          const parsed = JSON.parse(rawTx);
          if (Array.isArray(parsed)) processedTxRef.current = new Set(parsed);
        }
      } catch {}
      await ensureIapReady();
    })();

    return () => {
      clearIapWatchdog();
      iapUpdateSubRef.current?.remove?.();
      iapErrorSubRef.current?.remove?.();
      iapListenersAttachedRef.current = false;
      iapReadyRef.current = false;
      endConnection().catch(() => {});
    };
  }, [clearIapWatchdog, ensureIapReady]);

  const handleIapAction = useCallback(async (action, productId) => {
    if (iapBusyRef.current) return;
    const ready = await ensureIapReady();
    if (!ready) {
      pushIapStateToWebView({ busy: false, message: 'Mağaza şu anda kullanılamıyor. İnternet bağlantını kontrol et.' });
      return;
    }

    if (action === 'restore') {
      iapBusyRef.current = true;
      pushIapStateToWebView({ busy: true, message: 'Satın alımlar kontrol ediliyor…' });
      try {
        if (Platform.OS === 'ios') {
          await restorePurchases();
        }
        const res = await reconcilePurchases();
        if (res.ownsAdFree && res.recoveredWatts > 0) {
          pushIapStateToWebView({ adFree: true, busy: false, message: `✅ Reklamsız sürüm ve +${res.recoveredWatts} W geri yüklendi!` });
        } else if (res.ownsAdFree) {
          pushIapStateToWebView({ adFree: true, busy: false, message: '✅ Reklamsız sürüm geri yüklendi!' });
        } else if (res.recoveredWatts > 0) {
          pushIapStateToWebView({ busy: false, message: `✅ +${res.recoveredWatts} W hesabına geri yüklendi!` });
        } else {
          pushIapStateToWebView({ busy: false, message: 'Geri yüklenecek satın alım bulunamadı.' });
        }
      } catch {
        pushIapStateToWebView({ busy: false, message: 'Satın alımlar geri yüklenemedi. Tekrar dene.' });
      } finally {
        iapBusyRef.current = false;
      }
      return;
    }

    if (action === 'purchase') {
      const product = findIapProductById(productId);
      if (!product) return;
      if (product.id === IAP_PRODUCTS.remove_ads.id && adFreeRef.current) return;

      iapBusyRef.current = true;
      pushIapStateToWebView({ busy: true, message: 'Mağaza açılıyor…' });
      clearIapWatchdog();
      iapWatchdogRef.current = setTimeout(() => {
        if (!iapBusyRef.current) return;
        iapBusyRef.current = false;
        pushIapStateToWebView({ busy: false, message: '' });
        void reconcilePurchases().catch(() => {});
      }, IAP_WATCHDOG_MS);

      try {
        await requestPurchase({
          type: 'in-app',
          request: {
            apple: { sku: product.id },
            google: { skus: [product.id] },
          },
        });
      } catch (err) {
        clearIapWatchdog();
        iapBusyRef.current = false;
        const msg = isUserCancelledError(err)
          ? 'Satın alma iptal edildi.'
          : 'Satın alma başlatılamadı. Lütfen tekrar dene.';
        pushIapStateToWebView({ busy: false, message: msg });
      }
    }
  }, [clearIapWatchdog, ensureIapReady, pushIapStateToWebView, reconcilePurchases]);

  const hydrate = useCallback(async () => {
    setError('');
    webViewLoadedRef.current = false;
    setInitialSave(undefined);
    try {
      await saveQueue.current;
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      if (raw) JSON.parse(raw);
      setInitialSave(raw);
      setGeneration(value => value + 1);
    } catch {
      setError('Kayıt okunamadı. İlerlemenizi korumak için oyun açılmadı. Lütfen yeniden deneyin.');
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (interstitialShowingRef.current || rewardedShowingRef.current) return true;
      if (!webview.current) return false;
      webview.current.injectJavaScript(BACK_SCRIPT);
      return true;
    });
    const state = AppState.addEventListener('change', next => {
      const paused = next !== 'active' || interstitialShowingRef.current || rewardedShowingRef.current;
      if (next === 'active') {
        if (adsReady && !adFreeRef.current) {
          if (!bannerLoaded) setBannerKey(k => k + 1);
          preloadInterstitial();
        }
        if (adsInitializedRef.current) {
          preloadRewarded();
        }
        void ensureIapReady().then(ready => {
          if (ready && !iapBusyRef.current) return reconcilePurchases();
        }).catch(() => {});
      }
      webview.current?.injectJavaScript(`window.__nativePaused = ${paused}; if (!window.__nativePaused && typeof syncAndResetQuestsIfNeeded === 'function' && typeof renderMainMenu === 'function') { syncAndResetQuestsIfNeeded(); renderMainMenu(); } if (typeof saveProgress === 'function') saveProgress(); if (typeof sfx !== 'undefined') { if (typeof sfx.syncAmbient === 'function') sfx.syncAmbient(); if (sfx.ctx) { if (window.__nativePaused) sfx.ctx.suspend().catch(() => {}); else if (sfx.enabled) sfx.ctx.resume().catch(() => {}); } } true;`);
    });
    return () => { back.remove(); state.remove(); };
  }, [adsReady, bannerLoaded, ensureIapReady, preloadInterstitial, reconcilePurchases]);

  const source = useMemo(() => {
    if (initialSave === undefined) return null;
    // Embed before the game script: reliable on Android as well as WKWebView.
    const data = JSON.stringify(initialSave).replace(/</g, '\\u003c');
    return { html: gameHtml.replace('<head>', () => `<head><script>window.__nativeSave = ${data}; window.__nativePaused = false;</script>`) };
  }, [initialSave]);

  const onMessage = useCallback(event => {
    let message;
    try { message = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (message.type === 'save' && typeof message.value === 'string') {
      try { JSON.parse(message.value); } catch { return; }
      saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(SAVE_KEY, message.value)).catch(() => {
        if (!saveWarningShown.current) {
          saveWarningShown.current = true;
          Alert.alert('Kayıt yapılamadı', 'Cihazdaki boş alanı kontrol edin. Hesap ekranından yedek kodunuzu kopyalayabilirsiniz.');
        }
      });
    } else if (message.type === 'copy' && typeof message.value === 'string') {
      Clipboard.setStringAsync(message.value).catch(() => Alert.alert('Kopyalanamadı', 'Lütfen yeniden deneyin.'));
    } else if (message.type === 'ad_event') {
      if (message.event === 'round_completed') {
        adPolicyRef.current.recordRound();
      } else if (message.event === 'natural_break') {
        tryShowInterstitial();
      }
    } else if (message.type === 'rewarded_ad') {
      void tryShowRewarded(message.rewardType);
    } else if (message.type === 'haptic') {
      try {
        if (message.style === 'success') {
          Vibration.vibrate(Platform.OS === 'android' ? [0, 18, 35, 24] : 20);
        } else if (message.style === 'error') {
          Vibration.vibrate(Platform.OS === 'android' ? [0, 45, 35, 45] : 40);
        } else {
          Vibration.vibrate(10);
        }
      } catch {}
    } else if (message.type === 'iap') {
      void handleIapAction(message.action, message.productId);
    } else if (message.type === 'privacy_options') {
      void openPrivacyOptionsForm();
    } else if (message.type === 'feedback') {
      Linking.openURL('mailto:pikserax@gmail.com?subject=Devre%20Mimari%20Geri%20Bildirim').catch(() => {});
    } else if (message.type === 'exit' && Platform.OS === 'android') {
      Alert.alert('Oyundan çıkılsın mı?', 'Kaydedilmiş ilerlemeniz korunur.', [
        { text: 'Devam et', style: 'cancel' },
        { text: 'Çık', onPress: () => { saveQueue.current.finally(() => BackHandler.exitApp()); } },
      ]);
    }
  }, [handleIapAction, openPrivacyOptionsForm, tryShowInterstitial, tryShowRewarded]);

  if (error) return <View style={styles.center}><Text style={styles.text}>{error}</Text><Pressable onPress={hydrate} style={styles.button}><Text style={styles.text}>Yeniden dene</Text></Pressable></View>;
  if (!source) return <View style={styles.center}><ActivityIndicator color="#38bdf8" /></View>;
  return (
    <View style={styles.container}>
      <WebView
        key={generation}
        ref={webview}
        source={source}
        style={styles.webview}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('about:blank#')}
        onLoadEnd={() => {
          webViewLoadedRef.current = true;
          pushIapStateToWebView();
          pushPrivacyStateToWebView();
          void flushPendingConsumables();
        }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        textZoom={100}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        allowFileAccess={false}
        mixedContentMode="never"
        onError={() => setError('Oyun görüntülenemedi. Lütfen yeniden deneyin.')}
        onContentProcessDidTerminate={hydrate}
        onRenderProcessGone={() => { hydrate(); }}
      />
      {adsReady && !adFree && (
        <View style={bannerLoaded ? styles.bannerBox : styles.bannerHidden}>
          <BannerAd
            key={bannerKey}
            unitId={BANNER_UNIT_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdLoaded={() => setBannerLoaded(true)}
            onAdFailedToLoad={() => setBannerLoaded(false)}
          />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><SafeAreaView style={styles.root}><StatusBar barStyle="light-content" /><Game /></SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060a12' },
  container: { flex: 1, backgroundColor: '#060a12' },
  webview: { flex: 1, backgroundColor: '#060a12' },
  bannerBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#060a12', borderTopWidth: 1, borderTopColor: '#1e293b' },
  bannerHidden: { height: 0, overflow: 'hidden' },
  center: { flex: 1, backgroundColor: '#060a12', alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: '#f8fafc', textAlign: 'center', fontSize: 16 },
  button: { marginTop: 20, backgroundColor: '#0369a1', padding: 16, borderRadius: 12 },
});
