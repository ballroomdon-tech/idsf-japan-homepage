/**
 * events-notion.js
 * Netlify Function (/.netlify/functions/get-events) からデータを取得し、
 * カードグリッド形式で描画。カードクリックでモーダルを表示する。
 */

(function () {
  'use strict';

  const API_URL = '/.netlify/functions/get-events';

  const DOMESTIC_CATEGORIES = ['国内大会', '全日本選手権', '練習会'];
  const INTL_CATEGORIES     = ['国際大会', 'CSIT'];

  /* ---- フォールバック静的データ ---- */
  const FALLBACK = [
    {
      id: 'fb-1', title: 'Star Cup 新宿',
      dateStart: '2026-05-10', dateEnd: null,
      category: '国内大会', division: ['スタンダード', 'ラテン'],
      entryFee: 'エントリー費詳細は別途案内', entryDeadline: null, entryUrl: null,
      venue: '新宿コズミックセンター　東京都新宿区大久保3-1-2',
      region: '東京都 新宿区',
      description: 'IDSF Japan 主催のオープン大会。スタンダード・ラテン各部門で開催。初心者クラスからオープンクラスまで幅広い部門をご用意しています。',
      flyerImage: null,
      documents: [
        { label: 'シラバス（競技クラス別フィガー一覧）', type: 'シラバス', url: '/rules.html#syllabus' },
        { label: '大会ルール（年齢・クラス・審査方式 等）', type: '大会規程', url: '/rules.html' },
      ],
      isFallback: true,
    },
    {
      id: 'fb-2', title: '全日本ダンススポーツ選手権',
      dateStart: '2026-06-07', dateEnd: null,
      category: '全日本選手権', division: ['スタンダード', 'ラテン', '10ダンス'],
      entryFee: 'エントリー費詳細は別途案内', entryDeadline: null, entryUrl: null,
      venue: '東京ドームホテル B1F「天空」　東京都文京区後楽1-3-61',
      region: '東京都 文京区',
      description: 'IDSF Japan 主催の全日本選手権大会。日本一を決める最高峰の舞台。上位入賞者にはIDSF国際大会への推薦資格が与えられます。',
      flyerImage: null,
      documents: [
        { label: 'シラバス（競技クラス別フィガー一覧）', type: 'シラバス', url: '/rules.html#syllabus' },
        { label: '大会ルール（年齢・クラス・審査方式 等）', type: '大会規程', url: '/rules.html' },
      ],
      isFallback: true,
    },
    {
      id: 'fb-3', title: 'FEINDA — Italian Open 2026',
      dateStart: '2026-06-15', dateEnd: '2026-06-21',
      category: '国際大会', division: ['スタンダード', 'ラテン', '10ダンス'],
      entryFee: '詳細はお問い合わせください', entryDeadline: null, entryUrl: null,
      venue: 'Palacongressi di Cervia　Cervia (RA), Italia',
      region: 'Italy / Cervia',
      description: 'Festival Internazionale e Nazionale della Danza Sportiva。IDSF Japan が日本選手の出場をサポートします。',
      flyerImage: null,
      documents: [
        { label: 'IDSF シラバス（国際大会共通）', type: 'シラバス', url: '/rules.html#syllabus' },
      ],
      isFallback: true,
    },
  ];

  /* ========== 6/7 全日本選手権 大会資料 ==========
     タイムテーブル・エントリー一覧を該当大会（2026-06-07）のポップアップに
     「大会資料」として付与する。Notion・フォールバックいずれのデータ経路でも表示される。 */
  const CHAMPIONSHIP_2026_06_07_DOCS = [
    { label: 'タイムテーブル', type: '大会資料', url: '/events/japanese-championship-2026-timetable-en.pdf' },
    { label: 'エントリー一覧', type: '大会資料', url: '/events/japanese-championship-2026-entry-en.pdf' },
  ];
  function withChampionshipDocs(events) {
    (events || []).forEach(ev => {
      if (!ev || (ev.dateStart || '').slice(0, 10) !== '2026-06-07') return;
      ev.documents = (ev.documents || []).slice();
      CHAMPIONSHIP_2026_06_07_DOCS.forEach(doc => {
        if (!ev.documents.some(d => d && d.url === doc.url)) ev.documents.push(doc);
      });
    });
    return events;
  }

  /* ========== 9/22 第6回 STAR CUP 大会資料・タイムテーブル ==========
     PDFと同じ内容をHTML表としてポップアップ内に表示し、PDFも大会資料に付与する。 */
  const STARCUP_2026_09_22_DOCS = [
    { label: 'タイムテーブル', type: '大会資料', url: '/events/starcup-2026-09-22-timetable.pdf' },
    { label: 'エントリー一覧', type: '大会資料', url: '/events/starcup-2026-09-22-entry.pdf' },
  ];

  const STARCUP_2026_09_22_TIMETABLE = [
  {
    "time": "12:00",
    "type": "break",
    "name": "開会宣言・あいさつ"
  },
  {
    "time": "12:05",
    "no": 1,
    "name": "アダルトオープン ラテン",
    "round": "準決勝",
    "dances": "SCRPJ",
    "groups": 9,
    "note": "6組up・1ヒート"
  },
  {
    "time": "12:15",
    "no": 2,
    "name": "7/9 C スタンダード",
    "round": "決勝",
    "dances": "WVQ",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "12:20",
    "no": 3,
    "name": "10/11 C スタンダード",
    "round": "決勝",
    "dances": "WVQ",
    "groups": 2,
    "note": "順位法"
  },
  {
    "time": "12:25",
    "no": 4,
    "name": "アダルトD ラテン チャチャチャ",
    "round": "決勝",
    "dances": "C",
    "groups": 4,
    "note": "順位法"
  },
  {
    "time": "12:27",
    "no": 5,
    "name": "アダルトD ラテン ルンバ",
    "round": "決勝",
    "dances": "R",
    "groups": 4,
    "note": "順位法"
  },
  {
    "time": "12:29",
    "no": 6,
    "name": "シニア1オープン ラテン",
    "round": "決勝",
    "dances": "SCRPJ",
    "groups": 3,
    "note": "順位法・同時開始"
  },
  {
    "time": "12:29",
    "no": 7,
    "name": "シニア2オープン ラテン",
    "round": "決勝",
    "dances": "SCRPJ",
    "groups": 2,
    "note": "順位法・同時開始"
  },
  {
    "time": "12:29",
    "no": 8,
    "name": "シニア3オープン ラテン",
    "round": "決勝",
    "dances": "SCRPJ",
    "groups": 3,
    "note": "順位法・同時開始"
  },
  {
    "time": "12:29",
    "no": 9,
    "name": "シニア4オープン ラテン",
    "round": "決勝",
    "dances": "SCRPJ",
    "groups": 2,
    "note": "順位法・同時開始"
  },
  {
    "time": "12:38",
    "no": 10,
    "name": "U-16オープン スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 5,
    "note": "順位法"
  },
  {
    "time": "12:47",
    "no": 11,
    "name": "3/6 C スタンダード",
    "round": "決勝",
    "dances": "WVQ",
    "groups": 2,
    "note": "順位法"
  },
  {
    "time": "12:52",
    "no": 12,
    "name": "アダルトC ラテン",
    "round": "決勝",
    "dances": "SCR",
    "groups": 4,
    "note": "順位法"
  },
  {
    "time": "12:57",
    "no": 13,
    "name": "ジュブナイルオープン スタンダード",
    "round": "決勝",
    "dances": "WTVQ",
    "groups": 7,
    "note": "順位法"
  },
  {
    "time": "13:06",
    "no": 14,
    "name": "アダルトオープン ラテン",
    "round": "決勝",
    "dances": "SCRPJ",
    "groups": 6,
    "note": "順位法"
  },
  {
    "time": "13:16",
    "type": "break",
    "name": "表彰式"
  },
  {
    "time": "13:46",
    "type": "break",
    "name": "休憩"
  },
  {
    "time": "14:20",
    "no": 15,
    "name": "アダルトオープン スタンダード",
    "round": "準決勝",
    "dances": "WTVFQ",
    "groups": 11,
    "note": "6組up・2ヒート"
  },
  {
    "time": "14:38",
    "no": 16,
    "name": "7/9 C ラテン",
    "round": "決勝",
    "dances": "SCJ",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "14:43",
    "no": 17,
    "name": "10/11 C ラテン",
    "round": "決勝",
    "dances": "SCJ",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "14:48",
    "no": 18,
    "name": "シニア1オープン スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 4,
    "note": "順位法・同時開始"
  },
  {
    "time": "14:48",
    "no": 19,
    "name": "シニア2オープン スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 2,
    "note": "順位法・同時開始"
  },
  {
    "time": "14:57",
    "no": 20,
    "name": "アダルトD スタンダード ワルツ",
    "round": "決勝",
    "dances": "W",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "14:59",
    "no": 21,
    "name": "アダルトD スタンダード タンゴ",
    "round": "決勝",
    "dances": "T",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "15:01",
    "no": 22,
    "name": "3/6 C ラテン",
    "round": "決勝",
    "dances": "SCJ",
    "groups": 2,
    "note": "順位法"
  },
  {
    "time": "15:06",
    "no": 23,
    "name": "シニア3オープン スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 3,
    "note": "順位法・同時開始"
  },
  {
    "time": "15:06",
    "no": 24,
    "name": "シニア4オープン スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 1,
    "note": "順位法・同時開始"
  },
  {
    "time": "15:15",
    "no": 25,
    "name": "アダルトA1 スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "15:24",
    "no": 26,
    "name": "U-16オープン ラテン",
    "round": "決勝",
    "dances": "SCRPJ",
    "groups": 4,
    "note": "順位法"
  },
  {
    "time": "15:33",
    "no": 27,
    "name": "アダルトC スタンダード",
    "round": "決勝",
    "dances": "WTQ",
    "groups": 3,
    "note": "順位法"
  },
  {
    "time": "15:38",
    "no": 28,
    "name": "ジュブナイルオープン ラテン",
    "round": "決勝",
    "dances": "SCRJ",
    "groups": 8,
    "note": "順位法"
  },
  {
    "time": "15:47",
    "no": 29,
    "name": "アダルトオープン スタンダード",
    "round": "決勝",
    "dances": "WTVFQ",
    "groups": 6,
    "note": "順位法"
  },
  {
    "time": "15:57",
    "type": "break",
    "name": "表彰式"
  },
  {
    "time": "16:25",
    "type": "break",
    "name": "終了"
  }
];

  /* 9/22 第6回 STAR CUP エントリー一覧（主催者提出のエントリー表に基づく） */
  const STARCUP_2026_09_22_ENTRY = [
  {
    "name": "アダルトオープン ラテン",
    "pairs": [
      [
        "福馬智生",
        "泉名咲璃"
      ],
      [
        "柿澤夏月",
        "小堤帆夏"
      ],
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "井波龍一",
        "安井奈々恵"
      ],
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "河原正浩",
        "河原孝子"
      ],
      [
        "山下幸一",
        "照井千恵子"
      ],
      [
        "杉山大悟",
        "須田美咲"
      ],
      [
        "トコールアルトゥン",
        "土屋恵梨"
      ]
    ]
  },
  {
    "name": "アダルトオープン スタンダード",
    "pairs": [
      [
        "福馬智生",
        "泉名咲璃"
      ],
      [
        "柿澤夏月",
        "小堤帆夏"
      ],
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "佐藤陵汰",
        "古屋結楓"
      ],
      [
        "井波龍一",
        "安井奈々恵"
      ],
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "河原正浩",
        "河原孝子"
      ],
      [
        "田畑芽吹",
        "若島倫子"
      ],
      [
        "山下幸一",
        "照井千恵子"
      ],
      [
        "杉山大悟",
        "須田美咲"
      ],
      [
        "トコールアルトゥン",
        "土屋恵梨"
      ]
    ]
  },
  {
    "name": "シニア1 ラテン",
    "pairs": [
      [
        "井波龍一",
        "安井奈々恵"
      ],
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "河原正浩",
        "河原孝子"
      ]
    ]
  },
  {
    "name": "シニア1 スタンダード",
    "pairs": [
      [
        "井波龍一",
        "安井奈々恵"
      ],
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "河原正浩",
        "河原孝子"
      ],
      [
        "田畑芽吹",
        "若島倫子"
      ]
    ]
  },
  {
    "name": "シニア2 ラテン",
    "pairs": [
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "河原正浩",
        "河原孝子"
      ]
    ]
  },
  {
    "name": "シニア2 スタンダード",
    "pairs": [
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "河原正浩",
        "河原孝子"
      ]
    ]
  },
  {
    "name": "シニア3 ラテン",
    "pairs": [
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "山下幸一",
        "照井千恵子"
      ]
    ]
  },
  {
    "name": "シニア3 スタンダード",
    "pairs": [
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "西村拓一",
        "渡辺由紀子"
      ],
      [
        "山下幸一",
        "照井千恵子"
      ]
    ]
  },
  {
    "name": "シニア4 ラテン",
    "pairs": [
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "木嶋牧太郎",
        "木嶋恵理子"
      ]
    ]
  },
  {
    "name": "シニア4 スタンダード",
    "pairs": [
      [
        "伊勢隆太",
        "寺田美貴"
      ]
    ]
  },
  {
    "name": "U-16 ラテン",
    "pairs": [
      [
        "長谷川楓澄",
        "山本彩七"
      ],
      [
        "長谷川湊澄",
        "尾原有里彩"
      ],
      [
        "長谷川葵澄",
        "チェアヒ"
      ],
      [
        "佐藤凌久",
        "白取佑深"
      ]
    ]
  },
  {
    "name": "U-16 スタンダード",
    "pairs": [
      [
        "長谷川楓澄",
        "山本彩七"
      ],
      [
        "長谷川湊澄",
        "尾原有里彩"
      ],
      [
        "高井隆之介",
        "武井那優"
      ],
      [
        "長谷川葵澄",
        "チェアヒ"
      ],
      [
        "佐藤凌久",
        "白取佑深"
      ]
    ]
  },
  {
    "name": "ジュブナイル ラテン",
    "pairs": [
      [
        "長谷川楓澄",
        "山本彩七"
      ],
      [
        "山﨑奏人",
        "山﨑絃葉"
      ],
      [
        "長谷川湊澄",
        "尾原有里彩"
      ],
      [
        "河原隆之介",
        "喜古彩"
      ],
      [
        "齋藤蒼叡",
        "佐藤里咲"
      ],
      [
        "高井隆之介",
        "武井那優"
      ],
      [
        "長谷川葵澄",
        "チェアヒ"
      ],
      [
        "佐藤凌久",
        "白取佑深"
      ]
    ]
  },
  {
    "name": "ジュブナイル スタンダード",
    "pairs": [
      [
        "長谷川楓澄",
        "山本彩七"
      ],
      [
        "山﨑奏人",
        "山﨑絃葉"
      ],
      [
        "長谷川湊澄",
        "尾原有里彩"
      ],
      [
        "齋藤蒼叡",
        "佐藤里咲"
      ],
      [
        "高井隆之介",
        "武井那優"
      ],
      [
        "長谷川葵澄",
        "チェアヒ"
      ],
      [
        "佐藤凌久",
        "白取佑深"
      ]
    ]
  },
  {
    "name": "アダルトA1 スタンダード",
    "pairs": [
      [
        "福馬智生",
        "泉名咲璃"
      ],
      [
        "佐藤陵汰",
        "古屋結楓"
      ],
      [
        "田畑芽吹",
        "若島倫子"
      ]
    ]
  },
  {
    "name": "アダルトC ラテン",
    "pairs": [
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "今井真章",
        "三浦香澄"
      ],
      [
        "岡室考紀",
        "根本実結"
      ],
      [
        "木嶋牧太郎",
        "木嶋恵理子"
      ]
    ]
  },
  {
    "name": "アダルトC スタンダード",
    "pairs": [
      [
        "伊勢隆太",
        "寺田美貴"
      ],
      [
        "今井真章",
        "三浦香澄"
      ],
      [
        "岡室考紀",
        "根本実結"
      ]
    ]
  },
  {
    "name": "アダルトD ラテン（チャチャチャ/ルンバ）",
    "pairs": [
      [
        "佐藤陵汰",
        "古屋結楓"
      ],
      [
        "Rao Santosh",
        "小堤明子"
      ],
      [
        "岡室考紀",
        "根本実結"
      ],
      [
        "長谷川達三",
        "鈴木令子"
      ]
    ]
  },
  {
    "name": "アダルトD スタンダード（ワルツ/タンゴ）",
    "pairs": [
      [
        "Rao Santosh",
        "小堤明子"
      ],
      [
        "岡室考紀",
        "根本実結"
      ],
      [
        "長谷川達三",
        "鈴木令子"
      ]
    ]
  },
  {
    "name": "3-6歳C ラテン",
    "pairs": [
      [
        "山﨑奏人",
        "山﨑絃葉"
      ],
      [
        "齋藤蒼叡",
        "佐藤里咲"
      ]
    ]
  },
  {
    "name": "3-6歳C スタンダード",
    "pairs": [
      [
        "山﨑奏人",
        "山﨑絃葉"
      ],
      [
        "齋藤蒼叡",
        "佐藤里咲"
      ]
    ]
  },
  {
    "name": "7-9歳C ラテン",
    "pairs": [
      [
        "長谷川楓澄",
        "山本彩七"
      ],
      [
        "長谷川湊澄",
        "尾原有里彩"
      ],
      [
        "佐藤凌久",
        "白取佑深"
      ]
    ]
  },
  {
    "name": "7-9歳C スタンダード",
    "pairs": [
      [
        "長谷川楓澄",
        "山本彩七"
      ],
      [
        "長谷川湊澄",
        "尾原有里彩"
      ],
      [
        "佐藤凌久",
        "白取佑深"
      ]
    ]
  },
  {
    "name": "10-11歳C ラテン",
    "pairs": [
      [
        "河原隆之介",
        "喜古彩"
      ],
      [
        "高井隆之介",
        "武井那優"
      ],
      [
        "長谷川葵澄",
        "チェアヒ"
      ]
    ]
  },
  {
    "name": "10-11歳C スタンダード",
    "pairs": [
      [
        "高井隆之介",
        "武井那優"
      ],
      [
        "長谷川葵澄",
        "チェアヒ"
      ]
    ]
  }
];

  /* ダンス略記→日本語名（title属性用） */
  const DANCE_ABBR = {
    W: 'ワルツ', T: 'タンゴ', V: 'ベニィーズワルツ', F: 'スローフォックストロット', Q: 'クイックステップ',
    S: 'サンバ', C: 'チャチャチャ', R: 'ルンバ', P: 'パソドブレ', J: 'ジャイブ',
  };
  function dancesTitle(code) {
    return String(code || '').split('').map(ch => DANCE_ABBR[ch] || ch).join('・');
  }

  function withStarCupDocs(events) {
    (events || []).forEach(ev => {
      if (!ev || (ev.dateStart || '').slice(0, 10) !== '2026-09-22') return;
      ev.documents = (ev.documents || []).slice();
      STARCUP_2026_09_22_DOCS.forEach(doc => {
        if (!ev.documents.some(d => d && d.url === doc.url)) ev.documents.push(doc);
      });
      ev.timetable = STARCUP_2026_09_22_TIMETABLE;
      ev.entryList = STARCUP_2026_09_22_ENTRY;
    });
    return events;
  }

  /* ========== ユーティリティ ========== */

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function fmtDate(start, end) {
    if (!start) return '';
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const s = new Date(start + 'T00:00:00');
    const base = `${MONTHS[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
    if (end && end !== start) {
      const e = new Date(end + 'T00:00:00');
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
      }
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
    }
    return base;
  }

  function fmtDateJP(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    const DAYS = ['日','月','火','水','木','金','土'];
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}（${DAYS[d.getDay()]}）`;
  }

  function isUrgent(deadline) {
    if (!deadline) return false;
    const diff = new Date(deadline + 'T00:00:00') - Date.now();
    return diff > 0 && diff < 30 * 86400 * 1000;
  }

  function badgeClass(category) {
    if (category === '全日本選手権') return 'ev-card__badge--championship';
    if (category === '国際大会' || category === 'CSIT') return 'ev-card__badge--international';
    return '';
  }

  /**
   * 大会が「終了済み」かどうかを開催日基準で判定する。
   * 複数日開催の場合は終了日（dateEnd）を基準にし、開催当日は「開催予定」扱い。
   * 日付未定（dateStartなし）の場合は開催予定として扱う。
   */
  function isPast(ev) {
    const ref = ev.dateEnd || ev.dateStart;
    if (!ref) return false;
    const end = new Date(ref + 'T23:59:59');
    return end.getTime() < Date.now();
  }

  function modalBadgeClass(category) {
    if (category === '全日本選手権') return 'ev-modal__badge--championship';
    if (category === '国際大会' || category === 'CSIT') return 'ev-modal__badge--international';
    return '';
  }

  /* ========== カードHTML ========== */

  function cardHTML(ev) {
    const dateStr = fmtDate(ev.dateStart, ev.dateEnd) || ev.datePlanned || '';
    const past    = isPast(ev);

    // 終了バッジ（画像左上、カテゴリの下）
    const endedBadge = past
      ? `<span class="ev-card__ended">終了</span>`
      : '';

    // 地域バッジ（画像右下）
    const regionBadge = ev.region
      ? `<span class="ev-card__region" title="${esc(ev.region)}">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
             <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
           </svg>
           ${esc(ev.region)}
         </span>`
      : '';

    const imgArea = ev.flyerImage
      ? `<div class="ev-card__img">
           <img src="${esc(ev.flyerImage)}" alt="${esc(ev.title)} フライヤー" loading="lazy">
           <span class="ev-card__badge ${badgeClass(ev.category)}">${esc(ev.category)}</span>
           ${endedBadge}
           ${regionBadge}
         </div>`
      : `<div class="ev-card__img">
           <div class="ev-card__img-placeholder">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
               <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
               <polyline points="21 15 16 10 5 21"/>
             </svg>
             <span>FLYER COMING SOON</span>
           </div>
           <span class="ev-card__badge ${badgeClass(ev.category)}">${esc(ev.category)}</span>
           ${endedBadge}
           ${regionBadge}
         </div>`;

    const divTags = (ev.division || []).map(d =>
      `<span class="ev-card__div-tag">${esc(d)}</span>`).join('');

    const docCount = (ev.documents || []).length;
    const docBadge = docCount > 0
      ? `<span class="ev-card__doc-icon" title="資料 ${docCount} 件">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
           </svg>
           資料 ${docCount}
         </span>`
      : '';

    return `
    <article class="ev-card${past ? ' ev-card--past' : ''}" tabindex="0" role="button"
      aria-label="${esc(ev.title)}の詳細を見る${past ? '（終了した大会）' : ''}"
      data-event-id="${esc(ev.id)}">
      ${imgArea}
      <div class="ev-card__body">
        <p class="ev-card__date">${esc(dateStr)}${docBadge}</p>
        <h3 class="ev-card__title">${esc(ev.title)}</h3>
        ${ev.venue ? `<p class="ev-card__venue">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          ${esc(ev.venue)}
        </p>` : ''}
        ${divTags ? `<div class="ev-card__divisions">${divTags}</div>` : ''}
      </div>
    </article>`.trim();
  }

  /* ========== グリッド描画 ========== */

  /**
   * 大会カードのグリッドDOMを生成し、クリック/キーボードでモーダルを開く
   * イベントを束ねて返す。renderGrid から開催予定・過去の両セクションで使う。
   */
  function buildGrid(events) {
    const grid = document.createElement('div');
    grid.className = 'events-grid';
    grid.innerHTML = events.map(cardHTML).join('');

    grid.querySelectorAll('.ev-card').forEach(card => {
      const id = card.dataset.eventId;
      const ev = events.find(e => e.id === id);
      if (!ev) return;
      const open = () => openModal(ev);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    return grid;
  }

  function emptyStateHTML(msg) {
    return `
      <div class="events-status">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>${msg}</p>
      </div>`;
  }

  function renderGrid(containerId, loadingId, events, emptyMsg) {
    const container = document.getElementById(containerId);
    const loading   = document.getElementById(loadingId);
    if (!container) return;
    if (loading) loading.remove();
    container.innerHTML = '';

    if (!events || events.length === 0) {
      container.innerHTML = emptyStateHTML(emptyMsg);
      return;
    }

    // 開催予定（日付の早い順）／過去（日付の新しい順）に振り分け
    const dateVal = ev => (ev.dateStart || ev.dateEnd || '9999-12-31');
    const upcoming = events.filter(ev => !isPast(ev))
      .sort((a, b) => dateVal(a).localeCompare(dateVal(b)));
    const past = events.filter(isPast)
      .sort((a, b) => dateVal(b).localeCompare(dateVal(a)));

    // --- 開催予定セクション ---
    const upHeading = document.createElement('h2');
    upHeading.className = 'events-section-heading';
    upHeading.innerHTML = `開催予定の大会 <span class="events-section-count">${upcoming.length}</span>`;
    container.appendChild(upHeading);

    if (upcoming.length) {
      const upGrid = buildGrid(upcoming);
      container.appendChild(upGrid);
      if (window.revealObserver) {
        upGrid.querySelectorAll('.ev-card').forEach(el => window.revealObserver.observe(el));
      }
    } else {
      const note = document.createElement('div');
      note.innerHTML = emptyStateHTML('現在、開催予定の大会はありません。新しい大会が決まり次第お知らせします。');
      container.appendChild(note.firstElementChild);
    }

    // --- 過去の大会セクション（折りたたみ）---
    if (past.length) {
      const wrap = document.createElement('div');
      wrap.className = 'events-past';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'events-past-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = `
        <span class="events-past-toggle__label">過去の大会を表示</span>
        <span class="events-past-toggle__count">${past.length}</span>
        <svg class="events-past-toggle__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

      const panel = document.createElement('div');
      panel.className = 'events-past-panel';
      panel.hidden = true;

      let built = false;
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        if (!open && !built) {
          const pastGrid = buildGrid(past);
          panel.appendChild(pastGrid);
          if (window.revealObserver) {
            pastGrid.querySelectorAll('.ev-card').forEach(el => window.revealObserver.observe(el));
          }
          built = true;
        }
        toggle.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
        toggle.querySelector('.events-past-toggle__label').textContent =
          open ? '過去の大会を表示' : '過去の大会を隠す';
      });

      wrap.appendChild(toggle);
      wrap.appendChild(panel);
      container.appendChild(wrap);
    }
  }

  function showError(containerId, loadingId) {
    const container = document.getElementById(containerId);
    const loading   = document.getElementById(loadingId);
    if (loading) loading.remove();
    if (!container) return;
    container.innerHTML = `
      <div class="events-status error" role="alert">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>データの取得に失敗しました。しばらく経ってから再読み込みしてください。</p>
        <button class="btn btn--outline btn--sm" style="margin-top:1rem" onclick="location.reload()">再読み込み</button>
      </div>`;
  }

  /* ========== モーダル ========== */

  let _prevFocus = null;

  function openModal(ev) {
    const overlay = document.getElementById('ev-modal-overlay');
    const content = document.getElementById('ev-modal-content');
    if (!overlay || !content) return;

    _prevFocus = document.activeElement;

    // 画像（メイン + ポスターギャラリー）
    const imgHTML = ev.flyerImage
      ? `<a class="ev-modal__img-link" href="${esc(ev.flyerImage)}" target="_blank" rel="noopener noreferrer" aria-label="画像を原寸で開く">
           <img class="ev-modal__img" src="${esc(ev.flyerImage)}" alt="${esc(ev.title)} ポスター" loading="lazy">
           <span class="ev-modal__img-zoom" aria-hidden="true">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
           </span>
         </a>`
      : `<div class="ev-modal__img-placeholder">
           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8" aria-hidden="true">
             <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
           </svg>
         </div>`;

    // ポスターが複数枚ある場合のサムネギャラリー（2枚目以降）
    const extraPosters = (ev.posterImages || []).slice(1);
    const galleryHTML = extraPosters.length
      ? `<div class="ev-modal__gallery" role="region" aria-label="追加のポスター画像">
           ${extraPosters.map((url, i) => `
             <a class="ev-modal__gallery-item" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="ポスター ${i + 2} を開く">
               <img src="${esc(url)}" alt="${esc(ev.title)} ポスター ${i + 2}" loading="lazy">
             </a>`).join('')}
         </div>`
      : '';

    // 期間
    const dateStr = fmtDate(ev.dateStart, ev.dateEnd) || ev.datePlanned || '';

    // 締切
    const deadlineHTML = ev.entryDeadline
      ? `<tr>
           <th>締切</th>
           <td><span class="ev-modal__deadline-badge${isUrgent(ev.entryDeadline) ? ' urgent' : ''}">
             ${fmtDateJP(ev.entryDeadline)}${isUrgent(ev.entryDeadline) ? '　⚠ まもなく締切' : ''}
           </span></td>
         </tr>` : '';

    // 参加費
    const feeHTML = ev.entryFee
      ? `<tr><th>参加費</th><td>${esc(ev.entryFee)}</td></tr>` : '';

    // 区分
    const divHTML = (ev.division || []).length
      ? `<tr><th>種目</th><td>
           <div class="ev-modal__divisions">
             ${ev.division.map(d => `<span class="ev-modal__div-tag">${esc(d)}</span>`).join('')}
           </div>
         </td></tr>` : '';

    // 地域
    const regionHTML = ev.region
      ? `<tr><th>地域</th><td>
           <span class="ev-modal__region">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
               <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
             </svg>
             ${esc(ev.region)}
           </span>
         </td></tr>` : '';

    // 会場
    const venueHTML = ev.venue
      ? `<tr><th>会場</th><td>${esc(ev.venue)}</td></tr>` : '';

    // 資料セクション（シラバス・大会要項・その他PDF等）
    const docs = (ev.documents || []).filter(d => d && d.url);
    const docsHTML = docs.length
      ? `<div class="ev-modal__docs" role="region" aria-label="大会資料">
           <div class="ev-modal__docs-title">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
               <polyline points="14 2 14 8 20 8"/>
             </svg>
             大会資料
           </div>
           <ul class="ev-modal__docs-list">
             ${docs.map(d => {
               const isPdf = /\.pdf($|\?)/i.test(d.url);
               const icon = isPdf
                 ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <text x="7" y="17" font-size="6" font-weight="700" stroke="none" fill="currentColor">PDF</text>
                    </svg>`
                 : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>`;
               return `
                 <li>
                   <a class="ev-modal__doc-link" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">
                     <span class="ev-modal__doc-icon">${icon}</span>
                     <span class="ev-modal__doc-meta">
                       <span class="ev-modal__doc-label">${esc(d.label || d.type || 'ドキュメント')}</span>
                       ${d.type ? `<span class="ev-modal__doc-type">${esc(d.type)}${isPdf ? ' · PDF' : ''}</span>` : ''}
                     </span>
                     <svg class="ev-modal__doc-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                       <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
                     </svg>
                   </a>
                 </li>`;
             }).join('')}
           </ul>
         </div>`
      : '';

    // タイムテーブル
    const ttRows = (ev.timetable || []);
    const timetableHTML = ttRows.length
      ? `<details class="ev-modal__fold ev-modal__tt-wrap">
           <summary class="ev-modal__fold-head">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
               <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>
             </svg>
             <span class="ev-modal__fold-label">タイムテーブル</span>
             <span class="ev-modal__fold-count">全${ttRows.filter(r => r.type !== 'break').length}種目</span>
             <svg class="ev-modal__fold-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
           </summary>
           <p class="ev-modal__tt-note">※ 進行状況により時刻が前後する場合があります。余裕をもってご来場ください。</p>
           <div class="ev-modal__tt-scroll">
             <table class="ev-modal__tt">
               <thead>
                 <tr>
                   <th scope="col">時刻</th>
                   <th scope="col">No.</th>
                   <th scope="col">種目</th>
                   <th scope="col">ラウンド</th>
                   <th scope="col">ダンス</th>
                   <th scope="col">組数</th>
                   <th scope="col">備考</th>
                 </tr>
               </thead>
               <tbody>
                 ${ttRows.map(r => r.type === 'break'
                   ? `<tr class="is-break"><td class="tt-time">${esc(r.time)}</td><td colspan="6">${esc(r.name)}</td></tr>`
                   : `<tr>
                        <td class="tt-time">${esc(r.time)}</td>
                        <td class="tt-no">${esc(r.no)}</td>
                        <td class="tt-name">${esc(r.name)}</td>
                        <td>${esc(r.round)}</td>
                        <td class="tt-dance" title="${esc(dancesTitle(r.dances))}">${esc(r.dances)}</td>
                        <td class="tt-groups">${esc(r.groups)}</td>
                        <td class="tt-note">${esc(r.note || '')}</td>
                      </tr>`).join('')}
               </tbody>
             </table>
           </div>
           <p class="ev-modal__tt-legend">W=ワルツ、T=タンゴ、V=ベニィーズワルツ、F=スローフォックストロット、Q=クイックステップ／S=サンバ、C=チャチャチャ、R=ルンバ、P=パソドブレ、J=ジャイブ</p>
         </details>`
      : '';

    // エントリー一覧
    const entrySections = (ev.entryList || []);
    const entryListHTML = entrySections.length
      ? `<details class="ev-modal__fold ev-modal__entry-wrap">
           <summary class="ev-modal__fold-head">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
               <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
             </svg>
             <span class="ev-modal__fold-label">エントリー一覧</span>
             <span class="ev-modal__fold-count">${entrySections.length}部門・${entrySections.reduce((a, sec) => a + sec.pairs.length, 0)}組</span>
             <svg class="ev-modal__fold-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
           </summary>
           <p class="ev-modal__tt-note">※ 大会当日までに変更となる場合があります。最新版はPDFをご確認ください。</p>
           <div class="ev-modal__entry-grid">
             ${entrySections.map(sec => `
               <section class="ev-modal__entry-sec">
                 <h4 class="ev-modal__entry-head">${esc(sec.name)}<span class="ev-modal__entry-count">${sec.pairs.length}組</span></h4>
                 <ol class="ev-modal__entry-pairs">
                   ${sec.pairs.map(pr => `<li><span>${esc(pr[0])}</span><em>／</em><span>${esc(pr[1])}</span></li>`).join('')}
                 </ol>
               </section>`).join('')}
           </div>
         </details>`
      : '';

    // ボタン
    const entryBtn = ev.entryUrl
      ? `<a href="${esc(ev.entryUrl)}" class="ev-modal__entry-btn" target="_blank" rel="noopener noreferrer">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
             <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
           </svg>
           エントリーする
         </a>`
      : '';

    const fallbackNote = ev.isFallback
      ? `<p style="font-size:0.75rem;color:var(--color-text-light);margin-top:1rem;">
           ※ Notion接続設定後に最新情報へ自動更新されます。
         </p>` : '';

    content.innerHTML = `
      ${imgHTML}
      ${galleryHTML}
      <div class="ev-modal__body">
        <span class="ev-modal__badge ${modalBadgeClass(ev.category)}">${esc(ev.category)}</span>
        <h2 class="ev-modal__title" id="ev-modal-title">${esc(ev.title)}</h2>
        <table class="ev-modal__info" aria-label="大会詳細情報">
          <tbody>
            ${dateStr ? `<tr><th>開催日</th><td>${esc(dateStr)}</td></tr>` : ''}
            ${regionHTML}
            ${venueHTML}
            ${divHTML}
            ${feeHTML}
            ${deadlineHTML}
          </tbody>
        </table>
        ${ev.description ? `<p class="ev-modal__desc">${esc(ev.description)}</p>` : ''}
        ${timetableHTML}
        ${entryListHTML}
        ${docsHTML}
        <div class="ev-modal__actions">
          ${entryBtn}
          <a href="contact.html" class="ev-modal__contact-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            お問い合わせ
          </a>
        </div>
        ${fallbackNote}
      </div>`;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // フォーカスを閉じるボタンへ
    requestAnimationFrame(() => {
      document.getElementById('ev-modal-close')?.focus();
    });
  }

  function closeModal() {
    const overlay = document.getElementById('ev-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    _prevFocus?.focus();
  }

  function initModal() {
    const overlay = document.getElementById('ev-modal-overlay');
    const closeBtn = document.getElementById('ev-modal-close');
    const modal   = document.getElementById('ev-modal');
    if (!overlay || !closeBtn || !modal) return;

    overlay.setAttribute('aria-hidden', 'true');

    closeBtn.addEventListener('click', closeModal);

    // オーバーレイ背景クリックで閉じる
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    // Escキーで閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    // フォーカストラップ
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll(
        'a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ========== タブ ========== */

  function initTabs() {
    document.querySelectorAll('.events-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.events-tab-btn').forEach(b => {
          b.classList.remove('active'); b.setAttribute('aria-selected','false');
        });
        document.querySelectorAll('.events-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected','true');
        const panel = document.getElementById(`tab-${btn.dataset.tab}`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ========== データ取得 ========== */

  async function loadEvents() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = await res.json();
      if (!Array.isArray(events)) throw new Error('unexpected format');
      withChampionshipDocs(events);
      withStarCupDocs(events);

      const domestic = events.filter(e => DOMESTIC_CATEGORIES.includes(e.category));
      const intl     = events.filter(e => INTL_CATEGORIES.includes(e.category));

      renderGrid('events-domestic',      'loading-domestic',      domestic, '現在登録されている国内大会はありません。');
      renderGrid('events-international', 'loading-international', intl,     '現在登録されている国際大会はありません。');

      const meta = document.getElementById('events-meta');
      if (meta) {
        const now = new Date();
        meta.textContent = `最終更新: ${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      }

    } catch (err) {
      console.warn('API failed, using fallback:', err.message);
      withChampionshipDocs(FALLBACK);
      withStarCupDocs(FALLBACK);
      const domestic = FALLBACK.filter(e => DOMESTIC_CATEGORIES.includes(e.category));
      const intl     = FALLBACK.filter(e => INTL_CATEGORIES.includes(e.category));
      renderGrid('events-domestic',      'loading-domestic',      domestic, '現在登録されている国内大会はありません。');
      renderGrid('events-international', 'loading-international', intl,     '現在登録されている国際大会はありません。');
      const meta = document.getElementById('events-meta');
      if (meta) meta.textContent = '（暫定表示中 — Notion接続設定後に自動更新）';
    }
  }

  /* ========== 初期化 ========== */

  function init() {
    initTabs();
    initModal();
    loadEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
