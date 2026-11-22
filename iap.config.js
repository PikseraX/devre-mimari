// Merkezi Uygulama İçi Satın Alma (IAP) Ürün Kataloğu (Google Play & Apple App Store)
// Google Play Console ve App Store Connect'te bu ürün kimliklerini aynı adlarla oluşturun.

const IAP_PRODUCTS = {
  remove_ads: {
    id: 'devre_reklamlari_kaldir',
    type: 'non-consumable',
    isConsumable: false,
    wattAmount: 0,
    title: 'Reklamları Kaldır',
  },
  watt_500: {
    id: 'devre_watt_500',
    type: 'consumable',
    isConsumable: true,
    wattAmount: 500,
    title: '+500 W Enerji Paketi',
  },
  watt_1500: {
    id: 'devre_watt_1500',
    type: 'consumable',
    isConsumable: true,
    wattAmount: 1500,
    title: '+1.500 W Enerji Paketi',
  },
  watt_4000: {
    id: 'devre_watt_4000',
    type: 'consumable',
    isConsumable: true,
    wattAmount: 4000,
    title: '+4.000 W Süper Paket',
  },
};

const IAP_SKUS = Object.values(IAP_PRODUCTS).map(p => p.id);

function findIapProductById(productId) {
  return Object.values(IAP_PRODUCTS).find(p => p.id === productId) || null;
}

module.exports = { IAP_PRODUCTS, IAP_SKUS, findIapProductById };
