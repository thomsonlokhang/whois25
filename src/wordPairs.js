// Pairs must be similar-but-not-the-same.
// Same-thing pairs (太平山頂/山頂, 泳鏡/蛙鏡) and abbreviations break the game.

export const PAIR_CATEGORIES = [
  {
    id: 'hk',
    label: '香港',
    pairs: [
      ['尖沙咀', '中環'],
      ['銅鑼灣', '旺角'],
      ['淺水灣', '深水灣'],
      ['灣仔', '北角'],
      ['油麻地', '佐敦'],
      ['蘭桂坊', '蘇豪'],
      ['朗豪坊', '時代廣場'],
      ['太平山', '獅子山'],
      ['港大', '中大'],
      ['科大', '理大'],
      ['維多利亞港', '吐露港'],
      ['星光大道', '海濱長廊'],
      ['赤柱', '西貢'],
      ['金鐘', '太古'],
      ['迪士尼', '海洋公園'],
      ['天星小輪', '電車'],
      ['港鐵', '巴士'],
      ['的士', 'Uber'],
    ],
  },
  {
    id: 'people',
    label: '人物',
    pairs: [
      ['耶穌', '摩西'],
      ['彼得', '保羅'],
      ['亞當', '挪亞'],
      ['約翰', '雅各'],
      ['大衛', '所羅門'],
      ['馬利亞', '馬大'],
      ['以利亞', '以利沙'],
      ['周杰倫', '林俊傑'],
      ['張學友', '劉德華'],
      ['李小龍', '成龍'],
      ['古天樂', '梁朝偉'],
      ['特朗普', '拜登'],
      ['Steve Jobs', 'Elon Musk'],
      ['Stray Kids', 'BTS'],
    ],
  },
  {
    id: 'songs',
    label: '歌曲',
    pairs: [
      ['起風了', '光年之外'],
      ['稻香', '聽媽媽的話'],
      ['告白氣球', '晴天'],
      ['蒲公英的約定', '聽見下雨的聲音'],
      ['APT.', 'Flower'],
      ['任性', '如果可以'],
      ['七里香', '簡單愛'],
      ['說好不哭', '說好的幸福呢'],
    ],
  },
  {
    id: 'food',
    label: '食物',
    pairs: [
      ['蘋果', '梨'],
      ['漢堡', '三明治'],
      ['壽司', '刺身'],
      ['拉麵', '烏冬'],
      ['咖啡', '奶茶'],
      ['紅酒', '白酒'],
      ['朱古力', '可可'],
      ['米飯', '粥'],
      ['菠蘿包', '蛋撻'],
      ['腸粉', '河粉'],
      ['蛋治', '火腿治'],
      ['檸檬茶', '鴛鴦'],
    ],
  },
  {
    id: 'daily',
    label: '日常',
    pairs: [
      ['鋼琴', '電子琴'],
      ['小提琴', '中提琴'],
      ['結他', '烏克麗麗'],
      ['口琴', '笛子'],
      ['手機', '平板'],
      ['眼鏡', '隱形眼鏡'],
      ['雨傘', '雨衣'],
      ['iPhone', 'Android'],
      ['AirPods', '有線耳機'],
      ['筆記型電腦', '平板電腦'],
      ['電視', '電腦螢幕'],
      ['拖鞋', '涼鞋'],
      ['牙刷', '牙線'],
      ['鎖匙', '密碼鎖'],
      ['燈泡', '蠟燭'],
      ['鏡子', '玻璃窗'],
    ],
  },
  {
    id: 'sport',
    label: '運動／自然',
    pairs: [
      ['足球', '籃球'],
      ['羽毛球', '網球'],
      ['乒乓球', '壁球'],
      ['啞鈴', '壺鈴'],
      ['太陽', '月亮'],
      ['山', '海'],
      ['紅色', '橙色'],
      ['雨', '霧'],
    ],
  },
]

export const ALL_PAIRS = PAIR_CATEGORIES.flatMap((c) =>
  c.pairs.map((pair) => ({ pair, category: c.id, categoryLabel: c.label }))
)

export function pickRandomPair(categoryId = 'all') {
  const pool =
    categoryId === 'all'
      ? ALL_PAIRS
      : ALL_PAIRS.filter((p) => p.category === categoryId)
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export function suggestedTraitorCount(playerCount) {
  if (playerCount <= 5) return 1
  if (playerCount <= 8) return 1
  if (playerCount <= 12) return 2
  return 3
}
