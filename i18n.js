(function () {
    'use strict';

    const STORAGE_KEY = 'devre_mimari_lang_v1';

    const LANGS = [
        { code: 'tr', short: 'TR', flag: '🇹🇷', name: 'Türkçe' },
        { code: 'en', short: 'EN', flag: '🇬🇧', name: 'English' },
        { code: 'de', short: 'DE', flag: '🇩🇪', name: 'Deutsch' },
        { code: 'fr', short: 'FR', flag: '🇫🇷', name: 'Français' },
        { code: 'it', short: 'IT', flag: '🇮🇹', name: 'Italiano' },
        { code: 'es', short: 'ES', flag: '🇪🇸', name: 'Español' },
        { code: 'pt', short: 'PT', flag: '🇧🇷', name: 'Português' },
        { code: 'ru', short: 'RU', flag: '🇷🇺', name: 'Русский' },
        { code: 'ja', short: 'JA', flag: '🇯🇵', name: '日本語' },
        { code: 'el', short: 'EL', flag: '🇬🇷', name: 'Ελληνικά' },
        { code: 'zh-CN', short: 'ZH', flag: '🇨🇳', name: '简体中文' },
        { code: 'zh-TW', short: 'TW', flag: '🇹🇼', name: '繁體中文' }
    ];

    // Keyed by exact Turkish source string -> translations for 11 non-TR languages
    // Order: [en, de, fr, it, es, pt, ru, ja, el, zh-CN, zh-TW]
    const CODES = ['en', 'de', 'fr', 'it', 'es', 'pt', 'ru', 'ja', 'el', 'zh-CN', 'zh-TW'];

    const EXACT_ROWS = {
        'Devre Mimarı': ['Circuit Architect', 'Schaltkreis-Architekt', 'Architecte de Circuit', 'Architetto di Circuiti', 'Arquitecto de Circuitos', 'Arquiteto de Circuitos', 'Архитектор Схем', '回路アーキテクト', 'Αρχιτέκτονας Κυκλωμάτων', '电路架构师', '電路架構師'],
        'Başmühendis': ['Chief Engineer', 'Chefingenieur', 'Ingénieur en Chef', 'Ingegnere Capo', 'Ingeniero Jefe', 'Engenheiro-Chefe', 'Главный инженер', '主任技師', 'Αρχιμηχανικός', '首席工程师', '首席工程師'],
        'Stajyer Teknisyen': ['Apprentice Tech', 'Lehrling', 'Technicien Junior', 'Tecnico Apprendista', 'Técnico Aprendiz', 'Técnico Aprendiz', 'Стажёр', '見習い技術者', 'Μαθητευόμενος', '见习技师', '見習技師'],
        'Sıralama': ['Ranking', 'Rangliste', 'Classement', 'Classifica', 'Clasificación', 'Ranking', 'Рейтинг', 'ランキング', 'Κατάταξη', '排行榜', '排行榜'],
        'Aktif Şebeke Operasyonu': ['Active Grid Operation', 'Aktiver Netzbetrieb', 'Opération Réseau Active', 'Operazione Rete Attiva', 'Operación de Red Activa', 'Operação de Rede Ativa', 'Активная операция сети', 'アクティブ送電網作戦', 'Ενεργή Λειτουργία Δικτύου', '当前电网任务', '目前電網任務'],
        '🗺️ Harita': ['🗺️ Map', '🗺️ Karte', '🗺️ Carte', '🗺️ Mappa', '🗺️ Mapa', '🗺️ Mapa', '🗺️ Карта', '🗺️ マップ', '🗺️ Χάρτης', '🗺️ 地图', '🗺️ 地圖'],
        '👑 500/500 Şebeke Tamamlandı!': ['👑 500/500 Grids Completed!', '👑 500/500 Netze abgeschlossen!', '👑 500/500 Réseaux terminés !', '👑 500/500 Reti completate!', '👑 ¡500/500 Redes completadas!', '👑 500/500 Redes concluídas!', '👑 500/500 сетей пройдено!', '👑 500/500 グリッド完了！', '👑 500/500 Δίκτυα Ολοκληρώθηκαν!', '👑 已完成 500/500 电网！', '👑 已完成 500/500 電網！'],
        '🚀 Yeni Bölümler Yakında!': ['🚀 New Levels Coming Soon!', '🚀 Neue Level bald verfügbar!', '🚀 Nouveaux niveaux bientôt !', '🚀 Nuovi livelli in arrivo!', '🚀 ¡Nuevos niveles pronto!', '🚀 Novos níveis em breve!', '🚀 Новые уровни скоро!', '🚀 新ステージ近日公開！', '🚀 Νέα επίπεδα σύντομα!', '🚀 新关卡即将推出！', '🚀 新關卡即將推出！'],
        '⚡ ŞEBEKEYE BAĞLAN': ['⚡ CONNECT TO GRID', '⚡ MIT NETZ VERBINDEN', '⚡ CONNECTER AU RÉSEAU', '⚡ CONNETTI ALLA RETE', '⚡ CONECTAR A LA RED', '⚡ CONECTAR À REDE', '⚡ ПОДКЛЮЧИТЬСЯ К СЕТИ', '⚡ グリッドに接続', '⚡ ΣΥΝΔΕΣΗ ΣΤΟ ΔΙΚΤΥΟ', '⚡ 连接电网', '⚡ 連接電網'],
        '🌀 Plazma Türbini': ['🌀 Plasma Turbine', '🌀 Plasmaturbine', '🌀 Turbine Plasma', '🌀 Turbina al Plasma', '🌀 Turbina de Plasma', '🌀 Turbina de Plasma', '🌀 Плазменная турбина', '🌀 プラズマタービン', '🌀 Τουρμπίνα Πλάσματος', '🌀 等离子涡轮', '🌀 電漿渦輪'],
        '+3W/Bölüm': ['+3W/Level', '+3W/Level', '+3W/Niv.', '+3W/Liv.', '+3W/Nivel', '+3W/Nível', '+3W/Ур.', '+3W/面', '+3W/Επίπ.', '+3W/关', '+3W/關'],
        'Bölüm çözdükçe şarj olur': ['Charges as you solve levels', 'Lädt beim Lösen von Levels', 'Se charge à chaque niveau', 'Si carica risolvendo i livelli', 'Se carga al resolver niveles', 'Carrega ao resolver níveis', 'Заряжается при прохождении', 'クリアごとに充電', 'Φορτίζει σε κάθε επίπεδο', '通关即可充能', '通關即可充能'],
        '🎁 Sürpriz Kasa': ['🎁 Mystery Crate', '🎁 Überraschungskiste', '🎁 Coffre Mystère', '🎁 Cassa Misteriosa', '🎁 Caja Misteriosa', '🎁 Caixa Surpresa', '🎁 Сюрприз-ящик', '🎁 ミステリーボックス', '🎁 Κουτί Έκπληξη', '🎁 惊喜宝箱', '🎁 驚喜寶箱'],
        'ÜCRETSİZ': ['FREE', 'GRATIS', 'GRATUIT', 'GRATIS', 'GRATIS', 'GRÁTIS', 'БЕСПЛАТНО', '無料', 'ΔΩΡΕΑΝ', '免费', '免費'],
        'Alet & Watt Paketi': ['Tool & Watt Pack', 'Werkzeug & Watt', 'Pack Outils & Watt', 'Pacchetto Strumenti', 'Pack Herramientas', 'Pacote Ferramentas', 'Набор и Ватты', 'ツール＆ワット', 'Εργαλεία & Watt', '工具与瓦特包', '工具與瓦特包'],
        'Her gün 1 ücretsiz kasa': ['1 free crate every day', '1 Gratis-Kiste täglich', '1 coffre gratuit par jour', '1 cassa gratis al giorno', '1 caja gratis cada día', '1 caixa grátis por dia', '1 бесплатный ящик в день', '毎日1回無料ボックス', '1 δωρεάν κουτί την ημέρα', '每天1个免费宝箱', '每天1個免費寶箱'],
        'Dokun ve Aç →': ['Tap to Open →', 'Tippen & Öffnen →', 'Toucher & Ouvrir →', 'Tocca e Apri →', 'Toca y Abre →', 'Toque e Abra →', 'Нажми и открой →', 'タップして開く →', 'Πάτα για Άνοιγμα →', '点击开启 →', '點擊開啟 →'],
        '📅 7 Günlük Giriş': ['📅 7-Day Login', '📅 7-Tage-Login', '📅 Bonus 7 Jours', '📅 Accesso 7 Giorni', '📅 Acceso 7 Días', '📅 Login 7 Dias', '📅 Вход 7 дней', '📅 7日間ログイン', '📅 Είσοδος 7 Ημερών', '📅 7日签到', '📅 7日簽到'],
        '🎡 Kuantum Çarkı': ['🎡 Quantum Wheel', '🎡 Quantenrad', '🎡 Roue Quantique', '🎡 Ruota Quantica', '🎡 Ruleta Cuántica', '🎡 Roda Quântica', '🎡 Квантовое колесо', '🎡 量子ルーレット', '🎡 Κβαντικός Τροχός', '🎡 量子转盘', '🎡 量子轉盤'],
        '📖 Devre Elemanları Rehberi': ['📖 Circuit Components Guide', '📖 Bauteile-Handbuch', '📖 Guide des Composants', '📖 Guida ai Componenti', '📖 Guía de Componentes', '📖 Guia de Componentes', '📖 Справочник элементов', '📖 回路パーツガイド', '📖 Οδηγός Εξαρτημάτων', '📖 电路元件指南', '📖 電路元件指南'],
        '12 dönemlik tüm sembol ve kuralları incele': ['Explore all symbols & rules across 12 eras', 'Alle Symbole & Regeln aus 12 Epochen', 'Découvrez tous les symboles des 12 ères', 'Scopri tutti i simboli delle 12 ere', 'Explora todos los símbolos de las 12 eras', 'Explore todos os símbolos das 12 eras', 'Изучите все символы и правила 12 эпох', '12時代の全記号とルールを確認', 'Δες όλα τα σύμβολα των 12 εποχών', '查看12个时代的所有符号与规则', '查看12個時代的所有符號與規則'],
        'Rehber': ['Guide', 'Guide', 'Guide', 'Guida', 'Guía', 'Guia', 'Гид', 'ガイド', 'Οδηγός', '指南', '指南'],
        '⚡ Özel Operasyon Modları': ['⚡ Special Operations Modes', '⚡ Spezial-Einsatzmodi', '⚡ Modes Opérations Spéciales', '⚡ Modalità Operazioni Speciali', '⚡ Modos de Operación Especial', '⚡ Modos de Operação Especial', '⚡ Специальные режимы', '⚡ 特別作戦モード', '⚡ Ειδικές Λειτουργίες', '⚡ 特殊行动模式', '⚡ 特殊行動模式'],
        '📅 Günün Şebekesi': ['📅 Daily Grid', '📅 Tagesnetz', '📅 Réseau du Jour', '📅 Rete del Giorno', '📅 Red del Día', '📅 Rede do Dia', '📅 Сеть дня', '📅 デイリーグリッド', '📅 Δίκτυο της Ημέρας', '📅 每日电网', '📅 每日電網'],
        'Her gün tüm oyuncular için ortak sabit tohumlu bulmaca': ['Shared daily puzzle with the same seed for everyone', 'Gemeinsames tägliches Rätsel für alle Spieler', 'Puzzle quotidien partagé avec la même graine', 'Puzzle quotidiano condiviso per tutti i giocatori', 'Rompecabezas diario compartido para todos', 'Quebra-cabeça diário compartilhado para todos', 'Общая ежедневная головоломка для всех игроков', '全プレイヤー共通の日替わりパズル', 'Κοινό ημερήσιο παζλ για όλους τους παίκτες', '全球玩家每日共享同一固定种子谜题', '全球玩家每日共享同一固定種子謎題'],
        'Oyna': ['Play', 'Spielen', 'Jouer', 'Gioca', 'Jugar', 'Jogar', 'Играть', 'プレイ', 'Παίξε', '开始', '開始'],
        '⏱️ 60 Saniye Blitz': ['⏱️ 60-Second Blitz', '⏱️ 60-Sekunden-Blitz', '⏱️ Blitz 60 Secondes', '⏱️ Blitz 60 Secondi', '⏱️ Blitz 60 Segundos', '⏱️ Blitz 60 Segundos', '⏱️ Блиц 60 секунд', '⏱️ 60秒ブリッツ', '⏱️ Μπλιτς 60 Δευτ.', '⏱️ 60秒闪电战', '⏱️ 60秒閃電戰'],
        '60 saniyede maksimum şebeke çöz! Her çözüm +4 sn verir': ['Solve max grids in 60s! Each solve adds +4s', 'Löse max. Netze in 60s! Jedes +4 Sek.', 'Résous un max de réseaux en 60s ! +4s/réseau', 'Risolvi più reti in 60s! Ogni rete +4s', '¡Resuelve redes en 60s! Cada una da +4s', 'Resolva redes em 60s! Cada uma dá +4s', 'Реши максимум сетей за 60с! +4с за каждую', '60秒で何面解けるか挑戦！クリアごとに+4秒', 'Λύσε όσα περισσότερα δίκτυα σε 60δ! +4δ ανά λύση', '60秒内解开最多电网！每次通关+4秒', '60秒內解開最多電網！每次通關+4秒'],
        'Başlat': ['Start', 'Start', 'Lancer', 'Avvia', 'Iniciar', 'Iniciar', 'Старт', '開始', 'Έναρξη', '开始', '開始'],
        '🏅 3 Aşamalı Maraton': ['🏅 3-Stage Marathon', '🏅 3-Stufen-Marathon', '🏅 Marathon 3 Étapes', '🏅 Maratona 3 Fasi', '🏅 Maratón de 3 Fases', '🏅 Maratona 3 Fases', '🏅 Марафон 3 этапа', '🏅 3連マラソン', '🏅 Μαραθώνιος 3 Σταδίων', '🏅 三连马拉松', '🏅 三連馬拉松'],
        'Sigortaları koruyarak arka arkaya 3 zorlu şebekeyi tamamla': ['Complete 3 tough grids in a row protecting fuses', 'Meistere 3 schwere Netze in Folge ohne Sicherungsverlust', 'Termine 3 réseaux difficiles d’affilée en protégeant tes fusibles', 'Completa 3 reti difficili di fila proteggendo i fusibili', 'Completa 3 redes difíciles seguidas cuidando fusibles', 'Complete 3 redes difíceis seguidas protegendo fusíveis', 'Пройди 3 сложные сети подряд, сохранив предохранители', 'ヒューズを守りつつ難関3ステージ連続突破', 'Ολοκλήρωσε 3 δύσκολα δίκτυα στη σειρά', '保护保险丝并连续攻克3个高难电网', '保護保險絲並連續攻克3個高難電網'],
        '🌀 Şebeke Çöküşü': ['🌀 Grid Meltdown', '🌀 Netz-Kernschmelze', '🌀 Effondrement Réseau', '🌀 Collasso della Rete', '🌀 Colapso de Red', '🌀 Colapso da Rede', '🌀 Крах сети', '🌀 グリッド崩壊', '🌀 Κατάρρευση Δικτύου', '🌀 电网熔毁', '🌀 電網熔毀'],
        'Her dalga sonunda 1 Donanım Modülü (Perk) seç ve hayatta kal': ['Pick 1 Hardware Perk after each wave and survive', 'Wähle nach jeder Welle 1 Hardware-Perk und überlebe', 'Choisis 1 Module (Perk) après chaque vague et survis', 'Scegli 1 Modulo Hardware dopo ogni ondata e sopravvivi', 'Elige 1 Módulo (Perk) tras cada oleada y sobrevive', 'Escolha 1 Módulo (Perk) após cada onda e sobreviva', 'Выбирай 1 модуль после каждой волны и выживай', '各ウェーブ後にハードウェアパークを選んで生存', 'Διάλεξε 1 Μονάδα μετά από κάθε κύμα και επιβίωσε', '每波结束后选择1个硬件模块并生存下去', '每波結束後選擇1個硬體模組並生存下去'],
        '✏️ Özel Şebeke Tasarımcısı': ['✏️ Custom Grid Designer', '✏️ Netz-Editor', '✏️ Créateur de Réseau', '✏️ Editor di Reti', '✏️ Diseñador de Redes', '✏️ Criador de Redes', '✏️ Конструктор сетей', '✏️ カスタム回路エディタ', '✏️ Σχεδιαστής Δικτύων', '✏️ 自定义电网编辑器', '✏️ 自訂電網編輯器'],
        'Kendi 4x4 bulmacanı tasarla veya DM-... kodu yükle': ['Design your own 4x4 puzzle or load a DM-... code', 'Erstelle dein eigenes 4x4-Rätsel oder lade DM-...', 'Crée ton puzzle 4x4 ou charge un code DM-...', 'Crea il tuo puzzle 4x4 o carica un codice DM-...', 'Diseña tu propio puzzle 4x4 o carga un código DM-...', 'Crie seu puzzle 4x4 ou carregue um código DM-...', 'Создай свой 4x4 пазл или загрузи код DM-...', '4x4パズルを自作するかDM-...コードを読込', 'Φτιάξε το δικό σου 4x4 παζλ ή φόρτωσε κωδικό DM-...', '设计自己的4x4谜题或导入DM-...代码', '設計自己的4x4謎題或匯入DM-...代碼'],
        'Tasarımcı': ['Designer', 'Editor', 'Créateur', 'Editor', 'Editor', 'Editor', 'Редактор', 'エディタ', 'Σχεδιαστής', '编辑器', '編輯器'],
        'Yükle & Oyna': ['Load & Play', 'Laden & Spielen', 'Charger & Jouer', 'Carica & Gioca', 'Cargar y Jugar', 'Carregar e Jogar', 'Загрузить', '読込＆プレイ', 'Φόρτωση & Παιχνίδι', '加载并游玩', '載入並遊玩'],
        '🧰 Atölye': ['🧰 Workshop', '🧰 Werkstatt', '🧰 Atelier', '🧰 Officina', '🧰 Taller', '🧰 Oficina', '🧰 Мастерская', '🧰 工房', '🧰 Εργαστήριο', '🧰 工坊', '🧰 工坊'],
        '📋 Görevler': ['📋 Quests', '📋 Aufgaben', '📋 Quêtes', '📋 Missioni', '📋 Misiones', '📋 Missões', '📋 Задания', '📋 クエスト', '📋 Αποστολές', '📋 任务', '📋 任務'],
        '🏅 50 Rozet': ['🏅 50 Badges', '🏅 50 Abzeichen', '🏅 50 Badges', '🏅 50 Medaglie', '🏅 50 Insignias', '🏅 50 Medalhas', '🏅 50 Значков', '🏅 50バッジ', '🏅 50 Σήματα', '🏅 50徽章', '🏅 50徽章'],
        '💎 Enerji Mağazası': ['💎 Energy Store', '💎 Energie-Shop', '💎 Boutique d’Énergie', '💎 Negozio Energia', '💎 Tienda de Energía', '💎 Loja de Energia', '💎 Магазин энергии', '💎 エネルギーショップ', '💎 Κατάστημα Ενέργειας', '💎 能量商店', '💎 能量商店'],
        'Satın Alımları Geri Yükle': ['Restore Purchases', 'Käufe wiederherstellen', 'Restaurer achats', 'Ripristina acquisti', 'Restaurar compras', 'Restaurar compras', 'Восстановить покупки', '購入を復元', 'Επαναφορά αγορών', '恢复购买', '恢復購買'],
        '🚫 Reklamları Kaldır': ['🚫 Remove Ads', '🚫 Werbung entfernen', '🚫 Supprimer les pubs', '🚫 Rimuovi pubblicità', '🚫 Quitar anuncios', '🚫 Remover anúncios', '🚫 Убрать рекламу', '🚫 広告を削除', '🚫 Αφαίρεση διαφημίσεων', '🚫 移除广告', '🚫 移除廣告'],
        'Alt banner ve tüm geçiş reklamlarını kalıcı olarak kaldırır': ['Permanently removes bottom banner & interstitial ads', 'Entfernt Banner und Zwischenwerbung dauerhaft', 'Supprime définitivement bannières et interstitiels', 'Rimuove per sempre banner e annunci interstiziali', 'Elimina permanentemente banners y anuncios', 'Remove permanentemente banners e anúncios', 'Навсегда убирает баннеры и межстраничную рекламу', 'バナー広告とインタースティシャル広告を永久削除', 'Αφαιρεί μόνιμα όλα τα banner και τις διαφημίσεις', '永久移除底部横幅和所有插屏广告', '永久移除底部橫幅和所有插頁廣告'],
        'Satın Al': ['Buy', 'Kaufen', 'Acheter', 'Acquista', 'Comprar', 'Comprar', 'Купить', '購入', 'Αγορά', '购买', '購買'],
        '✅ Aktif': ['✅ Active', '✅ Aktiv', '✅ Actif', '✅ Attivo', '✅ Activo', '✅ Ativo', '✅ Активно', '✅ 有効', '✅ Ενεργό', '✅ 已激活', '✅ 已啟用'],
        '🧰 Mühendis Alet Çantası': ['🧰 Engineer Toolkit', '🧰 Werkzeugkasten', '🧰 Boîte à Outils', '🧰 Kit Ingegnere', '🧰 Kit de Herramientas', '🧰 Kit de Ferramentas', '🧰 Набор инженера', '🧰 エンジニアツール', '🧰 Εργαλειοθήκη', '🧰 工程师工具箱', '🧰 工程師工具箱'],
        '🔍 Prob İpucu': ['🔍 Probe Hint', '🔍 Sonden-Hinweis', '🔍 Indice Sonde', '🔍 Indizio Sonda', '🔍 Pista Sonda', '🔍 Dica Sonda', '🔍 Подсказка зонда', '🔍 プローブヒント', '🔍 Υπόδειξη Αισθητήρα', '🔍 探针提示', '🔍 探針提示'],
        'Bir soketi doğru çözüm voltajına lehimler ve kilitler': ['Solders & locks one socket to its exact solution voltage', 'Lötet & sperrt einen Sockel auf die richtige Spannung', 'Soude et verrouille une prise à la bonne tension', 'Salda e blocca una presa alla tensione corretta', 'Suelda y bloquea un zócalo a su voltaje exacto', 'Solda e trava um soquete na tensão correta', 'Запаивает и фиксирует один разъём на верном вольтаже', '1つのソケットを正解電圧ではんだ固定', 'Συγκολλά μια υποδοχή στη σωστή τάση', '将一个插座焊接并锁定为正确电压', '將一個插座焊接並鎖定為正確電壓'],
        '🔧 Lehim Sökücü': ['🔧 Desolderer', '🔧 Entlöter', '🔧 Dessoudeur', '🔧 Dissaldatore', '🔧 Desoldador', '🔧 Dessoldador', '🔧 Выпаиватель', '🔧 はんだ除去', '🔧 Αποσυγκολλητής', '🔧 除焊器', '🔧 除焊器'],
        'Kilitli (✕) bir soketi açarak kullanılabilir hale getirir': ['Unlocks a broken (✕) socket so it can be used', 'Öffnet einen gesperrten (✕) Sockel', 'Débloque une prise verrouillée (✕)', 'Sblocca una presa bloccata (✕)', 'Desbloquea un zócalo bloqueado (✕)', 'Desbloqueia um soquete travado (✕)', 'Открывает заблокированный (✕) разъём', 'ロック(✕)されたソケットを解除', 'Ξεκλειδώνει μια κλειδωμένη (✕) υποδοχή', '解锁一个损坏(✕)的插座使其可用', '解鎖一個損壞(✕)的插座使其可用'],
        '🔋 Yedek Jeneratör': ['🔋 Backup Generator', '🔋 Notstromgenerator', '🔋 Générateur de Secours', '🔋 Generatore di Riserva', '🔋 Generador Auxiliar', '🔋 Gerador Reserva', '🔋 Резервный генератор', '🔋 予備発電機', '🔋 Εφεδρική Γεννήτρια', '🔋 备用发电机', '🔋 備用發電機'],
        'Aktif bölümde +4 Hamle Kapasitesi ve +1⚡ Sigorta verir': ['Grants +4 Move Capacity and +1⚡ Fuse in current level', 'Gibt +4 Züge und +1⚡ Sicherung im aktuellen Level', 'Donne +4 Coups et +1⚡ Fusible dans le niveau actuel', 'Dona +4 Mosse e +1⚡ Fusibile nel livello attuale', 'Da +4 Movimientos y +1⚡ Fusible en el nivel actual', 'Dá +4 Jogadas e +1⚡ Fusível no nível atual', 'Даёт +4 хода и +1⚡ предохранитель в текущем уровне', '現在の面で手数+4とヒューズ+1⚡を付与', 'Δίνει +4 Κινήσεις και +1⚡ Ασφάλεια', '在当前关卡增加+4步数上限和+1⚡保险丝', '在當前關卡增加+4步數上限和+1⚡保險絲'],
        '👾 Kalıcı Boss Donanımları': ['👾 Permanent Boss Hardware', '👾 Permanente Boss-Hardware', '👾 Matériel Boss Permanent', '👾 Hardware Boss Permanente', '👾 Hardware Permanente de Jefe', '👾 Hardware Permanente de Chefe', '👾 Постоянное оборудование боссов', '👾 永続ボス装備', '👾 Μόνιμος Εξοπλισμός Boss', '👾 永久Boss硬件', '👾 永久Boss硬體'],
        '🎨 Anakart Temaları': ['🎨 Motherboard Themes', '🎨 Mainboard-Themes', '🎨 Thèmes Carte Mère', '🎨 Temi Scheda Madre', '🎨 Temas de Placa Base', '🎨 Temas de Placa-Mãe', '🎨 Темы материнской платы', '🎨 マザーボードテーマ', '🎨 Θέματα Μητρικής', '🎨 主板主题', '🎨 主板主題'],
        'Günlük': ['Daily', 'Täglich', 'Quotidien', 'Giornaliere', 'Diarias', 'Diárias', 'Ежедневные', 'デイリー', 'Ημερήσιες', '每日', '每日'],
        'Haftalık': ['Weekly', 'Wöchentlich', 'Hebdo', 'Settimanali', 'Semanales', 'Semanais', 'Недельные', 'ウィークリー', 'Εβδομαδιαίες', '每周', '每週'],
        '🏆 Oyun Sonu': ['🏆 Endgame', '🏆 Endspiel', '🏆 Fin de jeu', '🏆 Endgame', '🏆 Final', '🏆 Fim de Jogo', '🏆 Эндгейм', '🏆 エンドゲーム', '🏆 Τελικός', '🏆 终局', '🏆 終局'],
        'Her gün yenilenen mühendislik kontratlarını tamamla ve Watt kazan!': ['Complete daily engineering contracts and earn Watts!', 'Erfülle tägliche Aufträge und verdiene Watt!', 'Complète les contrats quotidiens et gagne des Watts !', 'Completa i contratti giornalieri e guadagna Watt!', '¡Completa contratos diarios y gana Watts!', 'Complete contratos diários e ganhe Watts!', 'Выполняй ежедневные контракты и получай Ватты!', '日替わり契約を達成してワットを獲得！', 'Ολοκλήρωσε καθημερινά συμβόλαια και κέρδισε Watt!', '完成每日工程合约赚取瓦特！', '完成每日工程合約賺取瓦特！'],
        'Kazanılan Başarım Rozetleri': ['Unlocked Achievement Badges', 'Freigeschaltete Abzeichen', 'Badges de Succès Débloqués', 'Medaglie Sbloccate', 'Insignias Desbloqueadas', 'Medalhas Desbloqueadas', 'Полученные значки достижений', '獲得した実績バッジ', 'Κερδισμένα Σήματα Επιτευγμάτων', '已解锁成就徽章', '已解鎖成就徽章'],
        '🏠 Ana Üs': ['🏠 Main Base', '🏠 Basis', '🏠 Base', '🏠 Base', '🏠 Base', '🏠 Base', '🏠 База', '🏠 ホーム', '🏠 Βάση', '🏠 主基地', '🏠 主基地'],
        '⚡ Özel Modlar': ['⚡ Modes', '⚡ Modi', '⚡ Modes', '⚡ Modalità', '⚡ Modos', '⚡ Modos', '⚡ Режимы', '⚡ モード', '⚡ Λειτουργίες', '⚡ 特殊模式', '⚡ 特殊模式'],
        '🛠️ Atölye & Görev': ['🛠️ Workshop', '🛠️ Werkstatt', '🛠️ Atelier', '🛠️ Officina', '🛠️ Taller', '🛠️ Oficina', '🛠️ Мастерская', '🛠️ 工房＆任務', '🛠️ Εργαστήριο', '🛠️ 工坊与任务', '🛠️ 工坊與任務'],
        'Sigorta': ['Fuse', 'Sicherung', 'Fusible', 'Fusibile', 'Fusible', 'Fusível', 'Предохр.', 'ヒューズ', 'Ασφάλεια', '保险丝', '保險絲'],
        'Aktif Soket': ['Active Sockets', 'Aktive Sockel', 'Prises Actives', 'Prese Attive', 'Zócalos Activos', 'Soquetes Ativos', 'Активные разъёмы', '有効ソケット', 'Ενεργές Υποδοχές', '激活插座', '啟用插座'],
        'Enerji': ['Energy', 'Energie', 'Énergie', 'Energia', 'Energía', 'Energia', 'Энергия', 'エネルギー', 'Ενέργεια', '能量', '能量'],
        'Soketlere dokunarak satır ve sütun hedef voltajlarını eşitle!': ['Tap sockets to match row & column target voltages!', 'Tippe auf Sockel, um Zielspannungen abzugleichen!', 'Touche les prises pour égaliser les tensions cibles !', 'Tocca le prese per abbinare le tensioni target!', '¡Toca los zócalos para igualar los voltajes objetivo!', 'Toque nos soquetes para igualar as tensões alvo!', 'Нажимайте на разъёмы, чтобы совпали целевые напряжения!', 'ソケットをタップして行と列の目標電圧を一致させよう！', 'Πάτα τις υποδοχές για να ταιριάξεις τις τάσεις!', '点击插座，使行和列达到目标电压！', '點擊插座，使行和列達到目標電壓！'],
        'Kutup': ['Polarity', 'Polung', 'Polarité', 'Polarità', 'Polaridad', 'Polaridade', 'Полярн.', '極性', 'Πολικότητα', '极性', '極性'],
        'Geri Al': ['Undo', 'Zurück', 'Annuler', 'Annulla', 'Deshacer', 'Desfazer', 'Отмена', '戻す', 'Αναίρεση', '撤销', '撤銷'],
        'İpucu': ['Hint', 'Hinweis', 'Indice', 'Indizio', 'Pista', 'Dica', 'Подск.', 'ヒント', 'Υπόδειξη', '提示', '提示'],
        'Lehim Sök': ['Desolder', 'Entlöten', 'Dessouder', 'Dissalda', 'Desoldar', 'Dessoldar', 'Выпаять', '除去', 'Αποσυγ.', '除焊', '除焊'],
        '+4 Hamle': ['+4 Moves', '+4 Züge', '+4 Coups', '+4 Mosse', '+4 Mov.', '+4 Jog.', '+4 Хода', '+4手', '+4 Κιν.', '+4步', '+4步'],
        'Sıfırla': ['Reset', 'Reset', 'RAZ', 'Reset', 'Reiniciar', 'Resetar', 'Сброс', 'リセット', 'Επαναφ.', '重置', '重置'],
        'Şebeke Senkronize!': ['Grid Synchronized!', 'Netz synchronisiert!', 'Réseau synchronisé !', 'Rete sincronizzata!', '¡Red sincronizada!', 'Rede sincronizada!', 'Сеть синхронизирована!', 'グリッド同期完了！', 'Δίκτυο Συγχρονίστηκε!', '电网已同步！', '電網已同步！'],
        'Sigorta Attı!': ['Fuse Blown!', 'Sicherung durchgebrannt!', 'Fusible grillé !', 'Fusibile bruciato!', '¡Fusible fundido!', 'Fusível queimado!', 'Предохранитель перегорел!', 'ヒューズが飛んだ！', 'Κάηκε η Ασφάλεια!', '保险丝熔断！', '保險絲熔斷！'],
        '🎬 Video İzle → +1⚡ Sigorta ile Devam Et': ['🎬 Watch Video → Continue with +1⚡ Fuse', '🎬 Video ansehen → Weiter mit +1⚡ Sicherung', '🎬 Voir vidéo → Continuer (+1⚡ Fusible)', '🎬 Guarda video → Continua con +1⚡ Fusibile', '🎬 Ver video → Seguir con +1⚡ Fusible', '🎬 Ver vídeo → Continuar com +1⚡ Fusível', '🎬 Смотреть видео → +1⚡ предохранитель', '🎬 動画視聴 → +1⚡ヒューズで続行', '🎬 Δες βίντεο → Συνέχεια με +1⚡ Ασφάλεια', '🎬 看视频 → +1⚡保险丝继续', '🎬 看影片 → +1⚡保險絲繼續'],
        'Sonraki Şebeke →': ['Next Grid →', 'Nächstes Netz →', 'Réseau suivant →', 'Prossima Rete →', 'Siguiente Red →', 'Próxima Rede →', 'Следующая сеть →', '次のグリッド →', 'Επόμενο Δίκτυο →', '下一电网 →', '下一電網 →'],
        '🔄 Tekrar Dene': ['🔄 Try Again', '🔄 Nochmal', '🔄 Réessayer', '🔄 Riprova', '🔄 Reintentar', '🔄 Tentar novamente', '🔄 Повторить', '🔄 もう一度', '🔄 Ξανά', '🔄 重试', '🔄 重試'],
        '🗺️ 500 Şebeke Operasyon Haritası': ['🗺️ 500-Grid Operations Map', '🗺️ 500-Netze-Einsatzkarte', '🗺️ Carte des 500 Réseaux', '🗺️ Mappa 500 Reti', '🗺️ Mapa de 500 Redes', '🗺️ Mapa de 500 Redes', '🗺️ Карта 500 сетей', '🗺️ 500グリッド作戦マップ', '🗺️ Χάρτης 500 Δικτύων', '🗺️ 500电网作战地图', '🗺️ 500電網作戰地圖'],
        '⚡ 12 Dönem • 500 Şebeke': ['⚡ 12 Eras • 500 Grids', '⚡ 12 Epochen • 500 Netze', '⚡ 12 Ères • 500 Réseaux', '⚡ 12 Ere • 500 Reti', '⚡ 12 Eras • 500 Redes', '⚡ 12 Eras • 500 Redes', '⚡ 12 эпох • 500 сетей', '⚡ 12時代 • 500グリッド', '⚡ 12 Εποχές • 500 Δίκτυα', '⚡ 12时代 • 500电网', '⚡ 12時代 • 500電網'],
        '🚀 Yeni Bölümler Yakında Gelecek!': ['🚀 New Levels Coming Soon!', '🚀 Neue Level folgen bald!', '🚀 Nouveaux niveaux bientôt !', '🚀 Nuovi livelli in arrivo!', '🚀 ¡Nuevos niveles muy pronto!', '🚀 Novos níveis em breve!', '🚀 Новые уровни скоро появятся!', '🚀 新ステージ近日登場！', '🚀 Νέα επίπεδα έρχονται σύντομα!', '🚀 更多新关卡即将上线！', '🚀 更多新關卡即將上線！'],
        '🎯 İşaretli bölüm güncel operasyon noktanızdır. Her 10. bölüm Boss (?) şebekesidir.': ['🎯 Highlighted level is your current operation. Every 10th level is a Boss (?) grid.', '🎯 Markiertes Level ist dein aktueller Stand. Jedes 10. Level ist ein Boss (?).', '🎯 Le niveau marqué est votre position. Chaque 10e niveau est un Boss (?).', '🎯 Il livello segnato è la tua posizione. Ogni 10° livello è un Boss (?).', '🎯 El nivel marcado es tu punto actual. Cada 10º nivel es un Jefe (?).', '🎯 O nível marcado é sua posição atual. Cada 10º nível é um Chefe (?).', '🎯 Отмечен текущий уровень. Каждый 10-й уровень — Босс (?).', '🎯 マーク付きが現在の作戦地点。10面ごとにボス(?)グリッド。', '🎯 Το επιλεγμένο είναι το τρέχον επίπεδο. Κάθε 10ο είναι Boss (?).', '🎯 标记处为当前进度。每第10关为Boss(?)电网。', '🎯 標記處為目前進度。每第10關為Boss(?)電網。'],
        '📖 12 Dönem Devre Elemanları Rehberi': ['📖 12-Era Circuit Components Guide', '📖 12-Epochen Bauteile-Handbuch', '📖 Guide des Composants (12 Ères)', '📖 Guida Componenti (12 Ere)', '📖 Guía de Componentes (12 Eras)', '📖 Guia de Componentes (12 Eras)', '📖 Справочник элементов (12 эпох)', '📖 12時代 回路パーツガイド', '📖 Οδηγός Εξαρτημάτων (12 Εποχές)', '📖 12时代电路元件指南', '📖 12時代電路元件指南'],
        '⚡ Temel Kurallar & Kutup (+1V / -1V)': ['⚡ Basic Rules & Polarity (+1V / -1V)', '⚡ Grundregeln & Polung (+1V / -1V)', '⚡ Règles de Base & Polarité (+1V / -1V)', '⚡ Regole Base & Polarità (+1V / -1V)', '⚡ Reglas Básicas y Polaridad (+1V / -1V)', '⚡ Regras Básicas e Polaridade (+1V / -1V)', '⚡ Базовые правила и полярность (+1V / -1V)', '⚡ 基本ルール＆極性 (+1V / -1V)', '⚡ Βασικοί Κανόνες & Πολικότητα (+1V / -1V)', '⚡ 基础规则与极性 (+1V / -1V)', '⚡ 基礎規則與極性 (+1V / -1V)'],
        '2x / 3x Trafo & -V Topraklama': ['2x / 3x Transformer & -V Ground', '2x / 3x Trafo & -V Erdung', 'Transfo 2x / 3x & Masse -V', 'Trasf. 2x / 3x & Terra -V', 'Trafo 2x / 3x y Tierra -V', 'Trafo 2x / 3x e Terra -V', 'Трансформатор 2x/3x и Земля -V', '2x / 3x 変圧器 & -V 接地', 'Μετασχηματιστής 2x/3x & -V', '2x / 3x 变压器与 -V 接地', '2x / 3x 變壓器與 -V 接地'],
        '➡️ Yatay Diyot & ⬇️ Dikey Diyot': ['➡️ Horizontal Diode & ⬇️ Vertical Diode', '➡️ Horizontale & ⬇️ Vertikale Diode', '➡️ Diode Horizontale & ⬇️ Verticale', '➡️ Diodo Orizzontale & ⬇️ Verticale', '➡️ Diodo Horizontal y ⬇️ Vertical', '➡️ Diodo Horizontal e ⬇️ Vertical', '➡️ Горизонтальный и ⬇️ Вертикальный диод', '➡️ 横ダイオード & ⬇️ 縦ダイオード', '➡️ Οριζόντια & ⬇️ Κάθετη Δίοδος', '➡️ 水平二极管与 ⬇️ 垂直二极管', '➡️ 水平二極體與 ⬇️ 垂直二極體'],
        '🔗 İkiz Soket & ⚖️ Tahterevalli': ['🔗 Twin Socket & ⚖️ Seesaw', '🔗 Zwillingssockel & ⚖️ Wippe', '🔗 Prises Jumelles & ⚖️ Balançoire', '🔗 Prese Gemelle & ⚖️ Altalena', '🔗 Zócalo Gemelo y ⚖️ Balancín', '🔗 Soquete Gêmeo e ⚖️ Gangorra', '🔗 Парный разъём и ⚖️ Качели', '🔗 ツインソケット & ⚖️ シーソー', '🔗 Δίδυμη Υποδοχή & ⚖️ Τραμπάλα', '🔗 孪生插座与 ⚖️ 跷跷板', '🔗 孿生插座與 ⚖️ 蹺蹺板'],
        '~V AC Dalga & ⏳ Kondansatör': ['~V AC Wave & ⏳ Capacitor', '~V AC-Welle & ⏳ Kondensator', 'Onde AC ~V & ⏳ Condensateur', 'Onda AC ~V & ⏳ Condensatore', 'Onda AC ~V y ⏳ Condensador', 'Onda AC ~V e ⏳ Capacitor', 'Волна AC ~V и ⏳ Конденсатор', '~V AC波 & ⏳ コンデンサ', 'Κύμα AC ~V & ⏳ Πυκνωτής', '~V 交流波与 ⏳ 电容器', '~V 交流波與 ⏳ 電容器'],
        '➕→ Bobin, 🧲 EMP & 🔄 Faz Dönüştürücü': ['➕→ Coil, 🧲 EMP & 🔄 Phase Inverter', '➕→ Spule, 🧲 EMP & 🔄 Phasendreher', '➕→ Bobine, 🧲 EMP & 🔄 Inverseur', '➕→ Bobina, 🧲 EMP & 🔄 Invertitore', '➕→ Bobina, 🧲 EMP e 🔄 Inversor', '➕→ Bobina, 🧲 EMP e 🔄 Inversor', '➕→ Катушка, 🧲 EMP и 🔄 Инвертор', '➕→ コイル・🧲 EMP・🔄 位相反転', '➕→ Πηνίο, 🧲 EMP & 🔄 Αναστροφέας', '➕→ 线圈、🧲 EMP 与 🔄 相位转换器', '➕→ 線圈、🧲 EMP 與 🔄 相位轉換器'],
        'Anlaşıldı': ['Got it', 'Verstanden', 'Compris', 'Capito', 'Entendido', 'Entendi', 'Понятно', '了解', 'Εντάξει', '明白了', '明白了'],
        '📅 7 Günlük Mühendis Giriş Ödülü': ['📅 7-Day Engineer Login Reward', '📅 7-Tage-Login-Belohnung', '📅 Récompense de Connexion 7 Jours', '📅 Premio Accesso 7 Giorni', '📅 Recompensa de 7 Días', '📅 Recompensa de Login 7 Dias', '📅 Награда за вход 7 дней', '📅 7日間ログインボーナス', '📅 Ανταμοιβή Εισόδου 7 Ημερών', '📅 7日工程师签到奖励', '📅 7日工程師簽到獎勵'],
        'Bugünün Ödülünü Al': ['Claim Today’s Reward', 'Heutige Belohnung holen', 'Récupérer le bonus du jour', 'Riscatta premio di oggi', 'Reclamar premio de hoy', 'Resgatar prêmio de hoje', 'Забрать награду дня', '今日の報酬を受取る', 'Λήψη σημερινής ανταμοιβής', '领取今日奖励', '領取今日獎勵'],
        '🎡 Kuantum Enerji Çarkı': ['🎡 Quantum Energy Wheel', '🎡 Quanten-Energierad', '🎡 Roue d’Énergie Quantique', '🎡 Ruota Energia Quantica', '🎡 Ruleta de Energía Cuántica', '🎡 Roda de Energia Quântica', '🎡 Квантовое колесо энергии', '🎡 量子エネルギールーレット', '🎡 Κβαντικός Τροχός Ενέργειας', '🎡 量子能量转盘', '🎡 量子能量轉盤'],
        'Şansını Dene!': ['Try Your Luck!', 'Versuch dein Glück!', 'Tente ta chance !', 'Tenta la fortuna!', '¡Prueba tu suerte!', 'Tente a sorte!', 'Испытай удачу!', '運試し！', 'Δοκίμασε την τύχη σου!', '试试手气！', '試試手氣！'],
        'Çarkı Çevir (Ücretsiz)': ['Spin Wheel (Free)', 'Rad drehen (Gratis)', 'Tourner la roue (Gratuit)', 'Gira la ruota (Gratis)', 'Girar ruleta (Gratis)', 'Girar roda (Grátis)', 'Крутить (Бесплатно)', '回す（無料）', 'Γύρισε τον Τροχό (Δωρεάν)', '转动转盘（免费）', '轉動轉盤（免費）'],
        '🎬 Video İzle → +1 Ücretsiz Hak': ['🎬 Watch Video → +1 Free Spin', '🎬 Video ansehen → +1 Freidreh', '🎬 Voir vidéo → +1 Tour Gratuit', '🎬 Guarda video → +1 Giro Gratis', '🎬 Ver video → +1 Giro Gratis', '🎬 Ver vídeo → +1 Giro Grátis', '🎬 Смотреть видео → +1 вращение', '🎬 動画視聴 → 無料スピン+1', '🎬 Δες βίντεο → +1 Δωρεάν Γύρισμα', '🎬 看视频 → +1次免费转动', '🎬 看影片 → +1次免費轉動'],
        '🌐 Dil Seçimi': ['🌐 Language', '🌐 Sprache', '🌐 Langue', '🌐 Lingua', '🌐 Idioma', '🌐 Idioma', '🌐 Язык', '🌐 言語選択', '🌐 Επιλογή Γλώσσας', '🌐 语言选择', '🌐 語言選擇'],
        'Donanım Modülü Seç': ['Select Hardware Module', 'Hardware-Modul wählen', 'Choisir un Module', 'Scegli Modulo Hardware', 'Elige Módulo Hardware', 'Escolha Módulo Hardware', 'Выберите модуль', 'ハードウェア選択', 'Επιλογή Μονάδας', '选择硬件模块', '選擇硬體模組'],
        '✏️ 4x4 Özel Şebeke Tasarımcısı': ['✏️ 4x4 Custom Grid Designer', '✏️ 4x4 Netz-Designer', '✏️ Créateur Réseau 4x4', '✏️ Editor Rete 4x4', '✏️ Diseñador Red 4x4', '✏️ Criador Rede 4x4', '✏️ Конструктор 4x4', '✏️ 4x4 カスタムエディタ', '✏️ Σχεδιαστής 4x4', '✏️ 4x4 自定义电网编辑器', '✏️ 4x4 自訂電網編輯器'],
        'Kopyala': ['Copy', 'Kopieren', 'Copier', 'Copia', 'Copiar', 'Copiar', 'Копировать', 'コピー', 'Αντιγραφή', '复制', '複製'],
        '⚡ Tasarımı Test Et & Oyna': ['⚡ Test & Play Design', '⚡ Design testen & spielen', '⚡ Tester & Jouer', '⚡ Testa e Gioca', '⚡ Probar y Jugar', '⚡ Testar e Jogar', '⚡ Проверить и играть', '⚡ テスト＆プレイ', '⚡ Δοκιμή & Παιχνίδι', '⚡ 测试并游玩', '⚡ 測試並遊玩'],
        '👤 Mühendis Hesabı & Yedekleme': ['👤 Engineer Account & Backup', '👤 Konto & Sicherung', '👤 Compte & Sauvegarde', '👤 Account & Backup', '👤 Cuenta y Respaldo', '👤 Conta e Backup', '👤 Аккаунт и бэкап', '👤 アカウント＆バックアップ', '👤 Λογαριασμός & Αντίγραφο', '👤 工程师账号与备份', '👤 工程師帳號與備份'],
        'Mühendis Çağrı Adı': ['Engineer Callsign', 'Ingenieur-Rufzeichen', 'Indicatif Ingénieur', 'Nome Ingegnere', 'Nombre de Ingeniero', 'Nome do Engenheiro', 'Позывной инженера', 'エンジニア名', 'Όνομα Μηχανικού', '工程师代号', '工程師代號'],
        '4 Haneli Güvenlik PIN Kodu': ['4-Digit Security PIN', '4-stellige Sicherheits-PIN', 'Code PIN à 4 chiffres', 'PIN di sicurezza a 4 cifre', 'PIN de seguridad de 4 dígitos', 'PIN de segurança de 4 dígitos', '4-значный PIN-код', '4桁セキュリティPIN', '4-ψήφιος κωδικός PIN', '4位安全PIN码', '4位安全PIN碼'],
        'Bilgileri Kaydet': ['Save Info', 'Speichern', 'Enregistrer', 'Salva', 'Guardar', 'Salvar', 'Сохранить', '保存', 'Αποθήκευση', '保存信息', '儲存資訊'],
        'Taşınabilir İlerleme Yedek Kodu': ['Portable Progress Backup Code', 'Portabler Sicherungscode', 'Code de sauvegarde portable', 'Codice backup portatile', 'Código de respaldo portable', 'Código de backup portátil', 'Переносимый код сохранения', '引き継ぎバックアップコード', 'Φορητός κωδικός αντιγράφου', '便携进度备份码', '可攜進度備份碼'],
        'Yükle': ['Load', 'Laden', 'Charger', 'Carica', 'Cargar', 'Carregar', 'Загрузить', '読込', 'Φόρτωση', '加载', '載入'],
        '🏆 Canlı Mühendis Sıralaması': ['🏆 Live Engineer Leaderboard', '🏆 Live-Rangliste', '🏆 Classement en Direct', '🏆 Classifica Live', '🏆 Clasificación en Vivo', '🏆 Ranking ao Vivo', '🏆 Рейтинг инженеров', '🏆 エンジニアランキング', '🏆 Ζωντανή Κατάταξη', '🏆 实时工程师排行榜', '🏆 即時工程師排行榜'],
        '🌍 Dünya': ['🌍 Global', '🌍 Welt', '🌍 Monde', '🌍 Mondo', '🌍 Mundial', '🌍 Mundial', '🌍 Мир', '🌍 世界', '🌍 Κόσμος', '🌍 全球', '🌍 全球'],
        '🇹🇷 Türkiye': ['🇹🇷 Turkey', '🇹🇷 Türkei', '🇹🇷 Turquie', '🇹🇷 Turchia', '🇹🇷 Turquía', '🇹🇷 Turquia', '🇹🇷 Турция', '🇹🇷 トルコ', '🇹🇷 Τουρκία', '🇹🇷 土耳其', '🇹🇷 土耳其'],
        '⚡ Modlar': ['⚡ Modes', '⚡ Modi', '⚡ Modes', '⚡ Modalità', '⚡ Modos', '⚡ Modos', '⚡ Режимы', '⚡ モード', '⚡ Λειτουργίες', '⚡ 模式', '⚡ 模式'],
        'Küresel Şebeke Başmühendisleri Sıralaması': ['Global Chief Grid Engineers Leaderboard', 'Globale Chefingenieur-Rangliste', 'Classement mondial des ingénieurs réseau', 'Classifica globale degli ingegneri capo', 'Clasificación global de ingenieros jefe', 'Ranking global de engenheiros-chefe', 'Мировой рейтинг главных инженеров сетей', '世界グリッド主任技師ランキング', 'Παγκόσμια κατάταξη αρχιμηχανικών', '全球电网首席工程师排行榜', '全球電網首席工程師排行榜'],
        'Temel Devre': ['Basic Circuit', 'Grundschaltung', 'Circuit de Base', 'Circuito Base', 'Circuito Básico', 'Circuito Básico', 'Базовая схема', '基本回路', 'Βασικό Κύκλωμα', '基础电路', '基礎電路'],
        '↩️ Son hamle geri alındı!': ['↩️ Last move undone!', '↩️ Letzter Zug rückgängig!', '↩️ Dernier coup annulé !', '↩️ Ultima mossa annullata!', '↩️ ¡Último movimiento deshecho!', '↩️ Última jogada desfeita!', '↩️ Последний ход отменён!', '↩️ 1手戻しました！', '↩️ Η τελευταία κίνηση αναιρέθηκε!', '↩️ 已撤销上一步！', '↩️ 已撤銷上一步！'],
        '↩️ Bu bölümde Geri Al hakkın tükendi!': ['↩️ No Undo uses left this level!', '↩️ Kein Rückgängig mehr übrig!', '↩️ Plus d’annulation pour ce niveau !', '↩️ Nessun Annulla rimasto!', '↩️ ¡Sin intentos de Deshacer!', '↩️ Sem usos de Desfazer restantes!', '↩️ Отмены на этом уровне закончились!', '↩️ この面の「戻す」回数がありません！', '↩️ Δεν έμειναν αναιρέσεις!', '↩️ 本关撤销次数已用完！', '↩️ 本關撤銷次數已用完！'],
        '↩️ Geri alınacak hamle yok.': ['↩️ No moves to undo.', '↩️ Kein Zug zum Rückgängigmachen.', '↩️ Aucun coup à annuler.', '↩️ Nessuna mossa da annullare.', '↩️ No hay movimientos para deshacer.', '↩️ Nenhuma jogada para desfazer.', '↩️ Нет ходов для отмены.', '↩️ 戻せる手がありません。', '↩️ Δεν υπάρχει κίνηση για αναίρεση.', '↩️ 没有可撤销的步骤。', '↩️ 沒有可撤銷的步驟。'],
        '⚡ +1 Sigorta eklendi! Devam edebilirsin.': ['⚡ +1 Fuse added! You can continue.', '⚡ +1 Sicherung erhalten! Weiter geht’s.', '⚡ +1 Fusible ajouté ! Tu peux continuer.', '⚡ +1 Fusibile aggiunto! Puoi continuare.', '⚡ +1 Fusible añadido. ¡Puedes continuar!', '⚡ +1 Fusível adicionado! Pode continuar.', '⚡ +1 предохранитель! Можно продолжить.', '⚡ ヒューズ+1追加！続行できます。', '⚡ Προστέθηκε +1 Ασφάλεια! Συνέχισε.', '⚡ 已获得+1保险丝！可以继续挑战。', '⚡ 已獲得+1保險絲！可以繼續挑戰。'],
        '🎡 +1 Ücretsiz Çark Hakkı eklendi!': ['🎡 +1 Free Wheel Spin added!', '🎡 +1 Freidreh hinzugefügt!', '🎡 +1 Tour gratuit ajouté !', '🎡 +1 Giro gratis aggiunto!', '🎡 ¡+1 Giro gratis añadido!', '🎡 +1 Giro grátis adicionado!', '🎡 +1 бесплатное вращение!', '🎡 無料スピン+1を獲得！', '🎡 Προστέθηκε +1 Δωρεάν Γύρισμα!', '🎡 已获得+1次免费转盘机会！', '🎡 已獲得+1次免費轉盤機會！'],
        '🔒 Geri Al özelliği Bölüm 26 (Dönem 3) itibarıyla açılır!': ['🔒 Undo unlocks at Level 26 (Era 3)!', '🔒 Rückgängig wird ab Level 26 (Epoche 3) freigeschaltet!', '🔒 Annuler se débloque au Niveau 26 (Ère 3) !', '🔒 Annulla si sblocca al Livello 26 (Era 3)!', '🔒 ¡Deshacer se desbloquea en el Nivel 26 (Era 3)!', '🔒 Desfazer desbloqueia no Nível 26 (Era 3)!', '🔒 Отмена открывается на уровне 26 (Эпоха 3)!', '🔒 「戻す」はステージ26（時代3）で解放されます！', '🔒 Η Αναίρεση ξεκλειδώνει στο Επίπεδο 26 (Εποχή 3)!', '🔒 撤销功能将于第26关（时代3）解锁！', '🔒 撤銷功能將於第26關（時代3）解鎖！'],
        '↩️ Geri alınacak hamle yok veya Geri Al hakkın bitti.': ['↩️ No moves to undo or no Undo uses left.', '↩️ Kein Zug zum Rückgängigmachen oder kein Versuch mehr.', '↩️ Aucun coup à annuler ou plus d’annulations.', '↩️ Nessuna mossa da annullare o tentativi esauriti.', '↩️ No hay movimientos para deshacer o sin intentos.', '↩️ Nenhuma jogada para desfazer ou sem usos restantes.', '↩️ Нет ходов для отмены или попытки закончились.', '↩️ 戻せる手がないか、残り回数がありません。', '↩️ Δεν υπάρχει κίνηση ή τέλειωσαν οι αναιρέσεις.', '↩️ 没有可撤销的步骤或次数已用完。', '↩️ 沒有可撤銷的步驟或次數已用完。'],
        '🎬 Ödül alındı! +1⚡ Sigorta ile operasyona devam ediyorsun!': ['🎬 Reward claimed! Continuing with +1⚡ Fuse!', '🎬 Belohnung erhalten! Weiter mit +1⚡ Sicherung!', '🎬 Récompense obtenue ! Tu continues avec +1⚡ Fusible !', '🎬 Premio ottenuto! Continui con +1⚡ Fusibile!', '🎬 ¡Recompensa recibida! ¡Sigues con +1⚡ Fusible!', '🎬 Recompensa recebida! Continuando com +1⚡ Fusível!', '🎬 Награда получена! Продолжаем с +1⚡ предохранителем!', '🎬 報酬獲得！+1⚡ヒューズで続行！', '🎬 Ανταμοιβή ελήφθη! Συνεχίζεις με +1⚡ Ασφάλεια!', '🎬 奖励已领取！获得+1⚡保险丝继续挑战！', '🎬 獎勵已領取！獲得+1⚡保險絲繼續挑戰！'],
        '🎬 +1 Ücretsiz Hak Kazanıldı!': ['🎬 +1 Free Spin Earned!', '🎬 +1 Freidreh erhalten!', '🎬 +1 Tour Gratuit gagné !', '🎬 +1 Giro Gratis ottenuto!', '🎬 ¡+1 Giro Gratis ganado!', '🎬 +1 Giro Grátis ganho!', '🎬 Получено +1 бесплатное вращение!', '🎬 無料スピン+1を獲得！', '🎬 Κερδήθηκε +1 Δωρεάν Γύρισμα!', '🎬 获得+1次免费机会！', '🎬 獲得+1次免費機會！'],
        '🔄 Şebeke sıfırlandı (Lehimli sabit soketler korundu).': ['🔄 Grid reset (Soldered fixed sockets preserved).', '🔄 Netz zurückgesetzt (Feste Sockel bleiben erhalten).', '🔄 Réseau réinitialisé (Prises soudées conservées).', '🔄 Rete azzerata (Prese saldate mantenute).', '🔄 Red reiniciada (Zócalos soldados conservados).', '🔄 Rede resetada (Soquetes soldados mantidos).', '🔄 Сеть сброшена (Запаянные разъёмы сохранены).', '🔄 グリッドをリセットしました（固定ソケット維持）。', '🔄 Το δίκτυο επαναφέρθηκε (Οι σταθερές υποδοχές διατηρήθηκαν).', '🔄 电网已重置（保留已焊接的固定插座）。', '🔄 電網已重置（保留已焊接的固定插座）。'],
        '🛡️ Seri Kalkanı': ['🛡️ Streak Shield', '🛡️ Serien-Schild', '🛡️ Bouclier de Série', '🛡️ Scudo Serie', '🛡️ Escudo de Racha', '🛡️ Escudo de Sequência', '🛡️ Щит серии', '🛡️ 連続シールド', '🛡️ Ασπίδα Σερί', '🛡️ 连胜护盾', '🛡️ 連勝護盾'],
        'Sigorta atsa veya kaybetsen bile serini korur': ['Protects your streak even if a fuse blows or you lose', 'Schützt deine Serie bei Sicherungsbruch oder Niederlage', 'Protège ta série même en cas d’échec ou de fusible grillé', 'Protegge la serie anche se perdi o bruci un fusibile', 'Protege tu racha incluso si fallas o fundes un fusible', 'Protege sua sequência mesmo se perder ou queimar fusível', 'Сохраняет серию даже при поражении или потере предохранителя', 'ヒューズ切れや敗北でも連続記録を守ります', 'Προστατεύει το σερί σου ακόμα και αν χάσεις', '即使保险丝熔断或失败也能保护你的连胜', '即使保險絲熔斷或失敗也能保護你的連勝'],
        'Oynanış & Erişilebilirlik': ['Gameplay & Accessibility', 'Gameplay & Barrierefreiheit', 'Jeu & Accessibilité', 'Gioco & Accessibilità', 'Juego y Accesibilidad', 'Jogo e Acessibilidade', 'Геймплей и доступность', 'プレイ＆アクセシビリティ', 'Παιχνίδι & Προσβασιμότητα', '游戏与无障碍', '遊戲與無障礙'],
        '📳 Titreşim: Açık': ['📳 Haptics: On', '📳 Vibration: Ein', '📳 Vibration : Oui', '📳 Vibrazione: Sì', '📳 Vibración: Sí', '📳 Vibração: Sim', '📳 Вибрация: Вкл', '📳 振動: オン', '📳 Δόνηση: Ναι', '📳 震动: 开', '📳 震動: 開'],
        '📳 Titreşim: Kapalı': ['📳 Haptics: Off', '📳 Vibration: Aus', '📳 Vibration : Non', '📳 Vibrazione: No', '📳 Vibración: No', '📳 Vibração: Não', '📳 Вибрация: Выкл', '📳 振動: オフ', '📳 Δόνηση: Όχι', '📳 震动: 关', '📳 震動: 關'],
        '👁️ Kontrast: Normal': ['👁️ Contrast: Normal', '👁️ Kontrast: Normal', '👁️ Contraste : Normal', '👁️ Contrasto: Normale', '👁️ Contraste: Normal', '👁️ Contraste: Normal', '👁️ Контраст: Обычный', '👁️ コントラスト: 標準', '👁️ Αντίθεση: Κανονική', '👁️ 对比度: 标准', '👁️ 對比度: 標準'],
        '👁️ Kontrast: Yüksek': ['👁️ Contrast: High', '👁️ Kontrast: Hoch', '👁️ Contraste : Élevé', '👁️ Contrasto: Alto', '👁️ Contraste: Alto', '👁️ Contraste: Alto', '👁️ Контраст: Высокий', '👁️ コントラスト: 高', '👁️ Αντίθεση: Υψηλή', '👁️ 对比度: 高', '👁️ 對比度: 高'],
        '🎉 Yeni Dönem Açıldı': ['🎉 New Era Unlocked', '🎉 Neue Epoche freigeschaltet', '🎉 Nouvelle Ère débloquée', '🎉 Nuova Era sbloccata', '🎉 Nueva Era desbloqueada', '🎉 Nova Era desbloqueada', '🎉 Открыта новая эпоха', '🎉 新時代解放！', '🎉 Νέα Εποχή Ξεκλειδώθηκε', '🎉 解锁新时代', '🎉 解鎖新時代'],
        '⚡ Operasyona Başla': ['⚡ Start Operation', '⚡ Einsatz starten', '⚡ Lancer l’opération', '⚡ Avvia operazione', '⚡ Iniciar operación', '⚡ Iniciar operação', '⚡ Начать операцию', '⚡ 作戦開始', '⚡ Έναρξη Λειτουργίας', '⚡ 开始行动', '⚡ 開始行動'],
        '↩️ Geri Al Özelliği Açıldı! (Bölüm başına 2 hak)': ['↩️ Undo Unlocked! (2 uses per level)', '↩️ Rückgängig freigeschaltet! (2x pro Level)', '↩️ Annuler débloqué ! (2 par niveau)', '↩️ Annulla sbloccato! (2 per livello)', '↩️ ¡Deshacer desbloqueado! (2 por nivel)', '↩️ Desfazer desbloqueado! (2 por nível)', '↩️ Отмена открыта! (2 раза за уровень)', '↩️ 「戻す」解放！（各ステージ2回）', '↩️ Η Αναίρεση ξεκλειδώθηκε! (2 ανά επίπεδο)', '↩️ 撤销功能已解锁！（每关2次）', '↩️ 撤銷功能已解鎖！（每關2次）'],
        '🛡️ +1 Seri Kalkanı eklendi!': ['🛡️ +1 Streak Shield added!', '🛡️ +1 Serien-Schild erhalten!', '🛡️ +1 Bouclier de Série ajouté !', '🛡️ +1 Scudo Serie aggiunto!', '🛡️ ¡+1 Escudo de Racha añadido!', '🛡️ +1 Escudo de Sequência adicionado!', '🛡️ +1 щит серии добавлен!', '🛡️ 連続シールド+1獲得！', '🛡️ Προστέθηκε +1 Ασπίδα Σερί!', '🛡️ 已获得 +1 连胜护盾！', '🛡️ 已獲得 +1 連勝護盾！'],
        '🛡️ Seri Kalkanı zaten maksimum (3/3)!': ['🛡️ Streak Shield is already full (3/3)!', '🛡️ Serien-Schild ist bereits voll (3/3)!', '🛡️ Bouclier de Série déjà au max (3/3) !', '🛡️ Scudo Serie già al massimo (3/3)!', '🛡️ ¡Escudo de Racha ya al máximo (3/3)!', '🛡️ Escudo de Sequência já no máximo (3/3)!', '🛡️ Щит серии уже максимальный (3/3)!', '🛡️ 連続シールドは最大です (3/3)！', '🛡️ Η Ασπίδα Σερί είναι ήδη πλήρης (3/3)!', '🛡️ 连胜护盾已达上限 (3/3)！', '🛡️ 連勝護盾已達上限 (3/3)！'],
        'Artık devrelerde kilitli (✕) ve sabit lehimli soketler karşına çıkacak. Sabit soketleri referans alarak hattı dengele!': ['Locked (✕) and fixed soldered sockets now appear. Use fixed sockets as anchors to balance the grid!', 'Gesperrte (✕) und feste Sockel erscheinen nun. Nutze feste Sockel als Referenz!', 'Des prises verrouillées (✕) et fixes apparaissent. Utilise-les comme repères !', 'Ora appaiono prese bloccate (✕) e fisse. Usale come riferimento per bilanciare la rete!', 'Ahora aparecen zócalos bloqueados (✕) y fijos. ¡Úsalos como referencia!', 'Agora surgem soquetes travados (✕) e fixos. Use-os como referência!', 'Теперь появляются заблокированные (✕) и фиксированные разъёмы!', 'ロック(✕)と固定ソケットが登場。固定ソケットを基準に調整しよう！', 'Τώρα εμφανίζονται κλειδωμένες (✕) και σταθερές υποδοχές!', '现在会出现锁定(✕)和固定插座。以固定插座为基准平衡电网！', '現在會出現鎖定(✕)和固定插座。以固定插座為基準平衡電網！'],
        '2x Trafo soketleri devreye girdi! Üzerindeki voltajı ikiye katlayarak hem satıra hem sütuna verir.': ['2x Transformer sockets are live! They double their voltage into both row and column.', '2x-Trafo-Sockel sind aktiv! Sie verdoppeln ihre Spannung für Zeile und Spalte.', 'Les prises Transfo 2x sont actives ! Elles doublent leur tension en ligne et colonne.', 'I trasformatori 2x sono attivi! Raddoppiano la tensione su riga e colonna.', '¡Llegan los zócalos Trafo 2x! Duplican su voltaje en fila y columna.', 'Soquetes Trafo 2x ativados! Eles dobram a tensão na linha e coluna.', 'Трансформаторы 2x в деле! Они удваивают напряжение в строке и столбце.', '2x変圧器が登場！電圧を2倍にして行と列に供給します。', 'Ενεργοποιήθηκαν οι μετασχηματιστές 2x! Διπλασιάζουν την τάση.', '2x 变压器插座已上线！将电压翻倍输出至所在行和列。', '2x 變壓器插座已上線！將電壓翻倍輸出至所在行和列。'],
        'Ters Akım (-V) topraklama soketleri açıldı! Bu soketler hattaki toplam voltajı düşürür.': ['Ground (-V) sockets unlocked! They subtract voltage from their row and column.', 'Erdungs-Sockel (-V) freigeschaltet! Sie ziehen Spannung von Zeile und Spalte ab.', 'Prises Masse (-V) débloquées ! Elles soustraient la tension de la ligne et colonne.', 'Prese Terra (-V) sbloccate! Sottraggono tensione da riga e colonna.', '¡Zócalos Tierra (-V) desbloqueados! Restan voltaje de su fila y columna.', 'Soquetes Terra (-V) desbloqueados! Eles subtraem tensão da linha e coluna.', 'Открыты разъёмы -V! Они вычитают напряжение из строки и столбца.', '-V接地ソケット解放！行と列の合計電圧を減算します。', 'Ξεκλειδώθηκαν οι υποδοχές -V! Αφαιρούν τάση από τη γραμμή και στήλη.', '解锁 -V 接地插座！它们会减少所在行和列的总电压。', '解鎖 -V 接地插座！它們會減少所在行和列的總電壓。'],
        '🏆 Haftalık 5\'li Mücadele': ['🏆 Weekly 5-Stage Challenge', '🏆 Wöchentliche 5er-Challenge', '🏆 Défi Hebdo 5 Étapes', '🏆 Sfida Settimanale 5 Fasi', '🏆 Desafío Semanal (5 Fases)', '🏆 Desafio Semanal (5 Fases)', '🏆 Недельный вызов (5 этапов)', '🏆 週間5連チャレンジ', '🏆 Εβδομαδιαία Πρόκληση 5 Σταδίων', '🏆 每周5关挑战赛', '🏆 每週5關挑戰賽'],
        'Haftada bir yenilenen ortak tohumlu 5 aşamalı özel şebeke serisi': ['Shared weekly 5-stage puzzle gauntlet refreshed every week', 'Gemeinsame wöchentliche 5-Stufen-Serie für alle Spieler', 'Série hebdomadaire partagée de 5 réseaux spéciaux', 'Serie settimanale condivisa di 5 reti speciali', 'Serie semanal compartida de 5 redes especiales', 'Série semanal compartilhada de 5 redes especiais', 'Общая еженедельная серия из 5 особых сетей', '毎週更新の全プレイヤー共通5ステージ特別連戦', 'Κοινή εβδομαδιαία σειρά 5 ειδικών δικτύων', '每周更新的全球共享5关连战谜题', '每週更新的全球共享5關連戰謎題'],
        '✅ Bu Hafta Tamamlandı': ['✅ Done This Week', '✅ Diese Woche fertig', '✅ Terminé cette semaine', '✅ Completata', '✅ Completado', '✅ Concluído', '✅ Пройдено', '✅ 今週クリア済', '✅ Ολοκληρώθηκε', '✅ 本周已完成', '✅ 本週已完成'],
        '📊 Mühendis İstatistik Karnesi': ['📊 Engineer Career Stats', '📊 Ingenieur-Statistiken', '📊 Statistiques Ingénieur', '📊 Statistiche Ingegnere', '📊 Estadísticas de Carrera', '📊 Estatísticas do Engenheiro', '📊 Статистика инженера', '📊 エンジニア戦績', '📊 Στατιστικά Μηχανικού', '📊 工程师生涯统计', '📊 工程師生涯統計'],
        'Çözülen': ['Solved', 'Gelöst', 'Résolus', 'Risolti', 'Resueltos', 'Resolvidos', 'Решено', 'クリア数', 'Λυμένα', '已通关', '已通關'],
        '3⭐ Oranı': ['3⭐ Rate', '3⭐ Quote', 'Taux 3⭐', 'Media 3⭐', 'Tasa 3⭐', 'Taxa 3⭐', '3⭐ %', '3⭐率', 'Ποσοστό 3⭐', '3⭐率', '3⭐率'],
        'En İyi Seri': ['Best Streak', 'Beste Serie', 'Meilleure Série', 'Miglior Serie', 'Mejor Racha', 'Melhor Seq.', 'Лучш. серия', '最高連続', 'Καλ. Σερί', '最高连胜', '最高連勝'],
        'Sigortasız': ['No-Fuse', 'Ohne Verlust', 'Sans Fusible', 'Senza Danni', 'Sin Fusible', 'Sem Perda', 'Без потерь', '無傷クリア', 'Ασφαλείς', '无损通关', '無損通關'],
        'Blitz Rekor': ['Blitz Best', 'Blitz Rekord', 'Record Blitz', 'Record Blitz', 'Récord Blitz', 'Recorde Blitz', 'Рекорд Блиц', 'ブリッツ最高', 'Ρεκόρ Blitz', '闪电战最高', '閃電戰最高'],
        'Çöküş Dalga': ['Meltdown Wave', 'Schmelze Welle', 'Vague Chute', 'Ondata Collasso', 'Oleada Colapso', 'Onda Colapso', 'Волна Краха', '崩壊ウェーブ', 'Κύμα Κρίσης', '熔毁波次', '熔毀波次'],
        '🎵 Müzik: Açık': ['🎵 Music: On', '🎵 Musik: Ein', '🎵 Musique : Oui', '🎵 Musica: Sì', '🎵 Música: Sí', '🎵 Música: Sim', '🎵 Музыка: Вкл', '🎵 BGM: オン', '🎵 Μουσική: Ναι', '🎵 音乐: 开', '🎵 音樂: 開'],
        '🎵 Müzik: Kapalı': ['🎵 Music: Off', '🎵 Musik: Aus', '🎵 Musique : Non', '🎵 Musica: No', '🎵 Música: No', '🎵 Música: Não', '🎵 Музыка: Выкл', '🎵 BGM: オフ', '🎵 Μουσική: Όχι', '🎵 音乐: 关', '🎵 音樂: 關'],
        '📖 Hızlı Mühendis Rehberi': ['📖 Quick Engineer Guide', '📖 Kurz-Handbuch', '📖 Guide Rapide', '📖 Guida Rapida', '📖 Guía Rápida', '📖 Guia Rápido', '📖 Краткий справочник', '📖 クイックガイド', '📖 Γρήγορος Οδηγός', '📖 快速工程师指南', '📖 快速工程師指南'],
        '⚡ Temel': ['⚡ Basics', '⚡ Basis', '⚡ Bases', '⚡ Base', '⚡ Básico', '⚡ Básico', '⚡ Основы', '⚡ 基本', '⚡ Βασικά', '⚡ 基础', '⚡ 基礎'],
        '🔌 Elemanlar': ['🔌 Parts', '🔌 Bauteile', '🔌 Pièces', '🔌 Elementi', '🔌 Piezas', '🔌 Peças', '🔌 Элементы', '🔌 パーツ', '🔌 Στοιχεία', '🔌 元件', '🔌 元件'],
        '🛠️ Aletler': ['🛠️ Tools', '🛠️ Werkzeuge', '🛠️ Outils', '🛠️ Strumenti', '🛠️ Herram.', '🛠️ Ferram.', '🛠️ Инструм.', '🛠️ ツール', '🛠️ Εργαλεία', '🛠️ 工具', '🛠️ 工具'],
        '🎮 Kontroller': ['🎮 Controls', '🎮 Steuerung', '🎮 Contrôles', '🎮 Controlli', '🎮 Controles', '🎮 Controles', '🎮 Управление', '🎮 操作方法', '🎮 Χειρισμός', '🎮 操作方式', '🎮 操作方式'],
        '🎯 Hedef, Sigorta & 3⭐': ['🎯 Targets, Fuses & 3⭐', '🎯 Ziele, Sicherung & 3⭐', '🎯 Cibles, Fusible & 3⭐', '🎯 Obiettivi, Fusibile & 3⭐', '🎯 Objetivos, Fusible y 3⭐', '🎯 Alvos, Fusível e 3⭐', '🎯 Цели, предохранители и 3⭐', '🎯 目標・ヒューズ・3⭐', '🎯 Στόχοι, Ασφάλεια & 3⭐', '🎯 目标、保险丝与3⭐', '🎯 目標、保險絲與3⭐'],
        '⚡ Özel Hat Kuralları': ['⚡ Special Line Rules', '⚡ Spezielle Linienregeln', '⚡ Règles Spéciales', '⚡ Regole Speciali', '⚡ Reglas de Línea', '⚡ Regras Especiais', '⚡ Особые правила линий', '⚡ 特殊ラインルール', '⚡ Ειδικοί Κανόνες', '⚡ 特殊线路规则', '⚡ 特殊線路規則'],
        '🛠️ Aletler & Koruma': ['🛠️ Tools & Protection', '🛠️ Werkzeuge & Schutz', '🛠️ Outils & Protection', '🛠️ Strumenti e Protezione', '🛠️ Herramientas y Protección', '🛠️ Ferramentas e Proteção', '🛠️ Инструменты и защита', '🛠️ ツール＆保護', '🛠️ Εργαλεία & Προστασία', '🛠️ 工具与保护', '🛠️ 工具與保護']
    };

    // Build fast Map<langCode, Map<trText, translatedText>>
    const DICT = {};
    for (const c of CODES) DICT[c] = new Map();
    for (const [tr, arr] of Object.entries(EXACT_ROWS)) {
        CODES.forEach((c, i) => {
            if (arr[i]) DICT[c].set(tr, arr[i]);
        });
    }

    // Dynamic regex templates (applied when exact match isn't found)
    const PATTERNS = [
        {
            re: /^BÖLÜM\s+(\d+)$/,
            t: {
                en: 'LEVEL $1', de: 'LEVEL $1', fr: 'NIVEAU $1', it: 'LIVELLO $1', es: 'NIVEL $1',
                pt: 'NÍVEL $1', ru: 'УРОВЕНЬ $1', ja: 'レベル $1', el: 'ΕΠΙΠΕΔΟ $1', 'zh-CN': '第 $1 关', 'zh-TW': '第 $1 關'
            }
        },
        {
            re: /^Bölüm\s+(\d+)$/,
            t: {
                en: 'Level $1', de: 'Level $1', fr: 'Niveau $1', it: 'Livello $1', es: 'Nivel $1',
                pt: 'Nível $1', ru: 'Уровень $1', ja: 'ステージ $1', el: 'Επίπεδο $1', 'zh-CN': '第 $1 关', 'zh-TW': '第 $1 關'
            }
        },
        {
            re: /^Dönem\s+(\d+)\s*•\s*(.+)$/,
            t: {
                en: 'Era $1 • $2', de: 'Epoche $1 • $2', fr: 'Ère $1 • $2', it: 'Era $1 • $2', es: 'Era $1 • $2',
                pt: 'Era $1 • $2', ru: 'Эпоха $1 • $2', ja: '時代 $1 • $2', el: 'Εποχή $1 • $2', 'zh-CN': '时代 $1 • $2', 'zh-TW': '時代 $1 • $2'
            }
        },
        {
            re: /^🔥\s*Seri:\s*(\d+)$/,
            t: {
                en: '🔥 Streak: $1', de: '🔥 Serie: $1', fr: '🔥 Série : $1', it: '🔥 Serie: $1', es: '🔥 Racha: $1',
                pt: '🔥 Sequência: $1', ru: '🔥 Серия: $1', ja: '🔥 連続: $1', el: '🔥 Σερί: $1', 'zh-CN': '🔥 连胜: $1', 'zh-TW': '🔥 連勝: $1'
            }
        },
        {
            re: /^Rekor:\s*(\d+)$/,
            t: {
                en: 'Best: $1', de: 'Rekord: $1', fr: 'Record : $1', it: 'Record: $1', es: 'Récord: $1',
                pt: 'Recorde: $1', ru: 'Рекорд: $1', ja: '最高: $1', el: 'Ρεκόρ: $1', 'zh-CN': '最高分: $1', 'zh-TW': '最高分: $1'
            }
        },
        {
            re: /^En İyi Dalga:\s*(\d+)$/,
            t: {
                en: 'Best Wave: $1', de: 'Beste Welle: $1', fr: 'Meilleure vague : $1', it: 'Miglior ondata: $1', es: 'Mejor oleada: $1',
                pt: 'Melhor onda: $1', ru: 'Лучшая волна: $1', ja: '最高ウェーブ: $1', el: 'Καλύτερο κύμα: $1', 'zh-CN': '最高波次: $1', 'zh-TW': '最高波次: $1'
            }
        },
        {
            re: /^Hamle\s*\(3⭐:(\d+)\)$/,
            t: {
                en: 'Moves (3⭐:$1)', de: 'Züge (3⭐:$1)', fr: 'Coups (3⭐:$1)', it: 'Mosse (3⭐:$1)', es: 'Mov. (3⭐:$1)',
                pt: 'Jogadas (3⭐:$1)', ru: 'Ходы (3⭐:$1)', ja: '手数 (3⭐:$1)', el: 'Κινήσεις (3⭐:$1)', 'zh-CN': '步数 (3⭐:$1)', 'zh-TW': '步數 (3⭐:$1)'
            }
        },
        {
            re: /^\(Stok:\s*(\d+)\)$/,
            t: {
                en: '(Stock: $1)', de: '(Vorrat: $1)', fr: '(Stock : $1)', it: '(Scorta: $1)', es: '(Stock: $1)',
                pt: '(Estoque: $1)', ru: '(Запас: $1)', ja: '(在庫: $1)', el: '(Απόθεμα: $1)', 'zh-CN': '(库存: $1)', 'zh-TW': '(庫存: $1)'
            }
        },
        {
            re: /^Gün\s+(\d+)\/7\s*•\s*Hazır!$/,
            t: {
                en: 'Day $1/7 • Ready!', de: 'Tag $1/7 • Bereit!', fr: 'Jour $1/7 • Prêt !', it: 'Giorno $1/7 • Pronto!', es: 'Día $1/7 • ¡Listo!',
                pt: 'Dia $1/7 • Pronto!', ru: 'День $1/7 • Готово!', ja: 'Day $1/7 • 受取可能!', el: 'Ημέρα $1/7 • Έτοιμο!', 'zh-CN': '第 $1/7 天 • 可领取!', 'zh-TW': '第 $1/7 天 • 可領取!'
            }
        },
        {
            re: /^(\d+)\s+Ücretsiz Hak$/,
            t: {
                en: '$1 Free Spin(s)', de: '$1 Freidreh(s)', fr: '$1 Tour(s) gratuit(s)', it: '$1 Giri gratis', es: '$1 Giro(s) gratis',
                pt: '$1 Giro(s) grátis', ru: 'Бесплатно: $1', ja: '無料回数: $1', el: '$1 Δωρεάν', 'zh-CN': '$1 次免费机会', 'zh-TW': '$1 次免費機會'
            }
        },
        {
            re: /^\+(\d+)W\s+Ödül$/,
            t: {
                en: '+$1W Reward', de: '+$1W Belohnung', fr: '+$1W Récompense', it: '+$1W Premio', es: '+$1W Premio',
                pt: '+$1W Prêmio', ru: '+$1W Награда', ja: '+$1W 報酬', el: '+$1W Έπαθλο', 'zh-CN': '+$1W 奖励', 'zh-TW': '+$1W 獎勵'
            }
        },
        {
            re: /^\+(\d+)\s*W\s+Enerji Kazanıldı$/,
            t: {
                en: '+$1 W Energy Earned', de: '+$1 W Energie erhalten', fr: '+$1 W Énergie gagnée', it: '+$1 W Energia ottenuta', es: '+$1 W Energía ganada',
                pt: '+$1 W Energia ganha', ru: '+$1 W энергии получено', ja: '+$1 W エネルギー獲得', el: '+$1 W Ενέργεια κερδήθηκε', 'zh-CN': '获得 +$1 W 能量', 'zh-TW': '獲得 +$1 W 能量'
            }
        },
        {
            re: /^🌀\s*Dalga\s+(\d+)\s+Tamamlandı$/,
            t: {
                en: '🌀 Wave $1 Completed', de: '🌀 Welle $1 abgeschlossen', fr: '🌀 Vague $1 terminée', it: '🌀 Ondata $1 completata', es: '🌀 Oleada $1 completada',
                pt: '🌀 Onda $1 concluída', ru: '🌀 Волна $1 пройдена', ja: '🌀 ウェーブ $1 完了', el: '🌀 Κύμα $1 Ολοκληρώθηκε', 'zh-CN': '🌀 第 $1 波完成', 'zh-TW': '🌀 第 $1 波完成'
            }
        },
        {
            re: /^~V\s*Faz:\s*(.+)$/,
            t: {
                en: '~V Phase: $1', de: '~V Phase: $1', fr: '~V Phase : $1', it: '~V Fase: $1', es: '~V Fase: $1',
                pt: '~V Fase: $1', ru: '~V Фаза: $1', ja: '~V 位相: $1', el: '~V Φάση: $1', 'zh-CN': '~V 相位: $1', 'zh-TW': '~V 相位: $1'
            }
        },
        {
            re: /^💡\s*Yeni Eleman\s*\(([^)]+)\):\s*(.+)$/,
            t: {
                en: '💡 New Element ($1): $2', de: '💡 Neues Bauteil ($1): $2', fr: '💡 Nouvel élément ($1) : $2', it: '💡 Nuovo elemento ($1): $2', es: '💡 Nuevo elemento ($1): $2',
                pt: '💡 Novo elemento ($1): $2', ru: '💡 Новый элемент ($1): $2', ja: '💡 新パーツ ($1): $2', el: '💡 Νέο στοιχείο ($1): $2', 'zh-CN': '💡 新元件 ($1): $2', 'zh-TW': '💡 新元件 ($1): $2'
            }
        },
        {
            re: /^↩️\s*Son hamle geri alındı\s*\(Kalan Geri Al:\s*(\d+)\)\.$/,
            t: {
                en: '↩️ Last move undone (Undo left: $1).', de: '↩️ Zug rückgängig (Verbleibend: $1).', fr: '↩️ Coup annulé (Restant : $1).', it: '↩️ Mossa annullata (Rimasti: $1).', es: '↩️ Movimiento deshecho (Restantes: $1).',
                pt: '↩️ Jogada desfeita (Restantes: $1).', ru: '↩️ Ход отменён (Осталось: $1).', ja: '↩️ 1手戻しました（残り: $1）。', el: '↩️ Η κίνηση αναιρέθηκε (Υπόλοιπο: $1).', 'zh-CN': '↩️ 已撤销上一步（剩余: $1）。', 'zh-TW': '↩️ 已撤銷上一步（剩餘: $1）。'
            }
        },
        {
            re: /^\(Stok:\s*(\d+)\/(\d+)\)$/,
            t: {
                en: '(Stock: $1/$2)', de: '(Vorrat: $1/$2)', fr: '(Stock : $1/$2)', it: '(Scorta: $1/$2)', es: '(Stock: $1/$2)',
                pt: '(Estoque: $1/$2)', ru: '(Запас: $1/$2)', ja: '(在庫: $1/$2)', el: '(Απόθεμα: $1/$2)', 'zh-CN': '(库存: $1/$2)', 'zh-TW': '(庫存: $1/$2)'
            }
        },
        {
            re: /^🎬\s*Video İzle\s*→\s*Ödülü 2x Yap\s*\(\+(\d+)\s*W\)$/,
            t: {
                en: '🎬 Watch Video → 2x Reward (+$1 W)', de: '🎬 Video ansehen → 2x Belohnung (+$1 W)', fr: '🎬 Voir vidéo → Récompense 2x (+$1 W)', it: '🎬 Guarda video → Premio 2x (+$1 W)', es: '🎬 Ver video → Premio 2x (+$1 W)',
                pt: '🎬 Ver vídeo → Prêmio 2x (+$1 W)', ru: '🎬 Видео → Награда 2x (+$1 W)', ja: '🎬 動画視聴 → 報酬2倍 (+$1 W)', el: '🎬 Δες βίντεο → 2x Έπαθλο (+$1 W)', 'zh-CN': '🎬 看视频 → 奖励翻倍 (+$1 W)', 'zh-TW': '🎬 看影片 → 獎勵翻倍 (+$1 W)'
            }
        },
        {
            re: /^⚡\s*\+(\d+)\s*W\s*Enerji Kazanıldı\s*\(2x!\)$/,
            t: {
                en: '⚡ +$1 W Energy Earned (2x!)', de: '⚡ +$1 W Energie erhalten (2x!)', fr: '⚡ +$1 W Énergie gagnée (2x !)', it: '⚡ +$1 W Energia ottenuta (2x!)', es: '⚡ +$1 W Energía ganada (2x!)',
                pt: '⚡ +$1 W Energia ganha (2x!)', ru: '⚡ +$1 W энергии (2x!)', ja: '⚡ +$1 W エネルギー獲得 (2倍!)', el: '⚡ +$1 W Ενέργεια (2x!)', 'zh-CN': '⚡ 获得 +$1 W 能量 (双倍!)', 'zh-TW': '⚡ 獲得 +$1 W 能量 (雙倍!)'
            }
        },
        {
            re: /^🛡️\s*Seri Kalkanı devreye girdi!\s*(\d+)\s*serin korundu!$/,
            t: {
                en: '🛡️ Streak Shield activated! Your $1 streak is safe!', de: '🛡️ Serien-Schild aktiv! Deine $1er-Serie bleibt erhalten!', fr: '🛡️ Bouclier activé ! Ta série de $1 est sauvée !', it: '🛡️ Scudo attivo! La tua serie di $1 è salva!', es: '🛡️ ¡Escudo activado! ¡Tu racha de $1 está a salvo!',
                pt: '🛡️ Escudo ativado! Sua sequência de $1 foi salva!', ru: '🛡️ Щит серии сработал! Серия $1 сохранена!', ja: '🛡️ 連続シールド発動！$1連勝を守りました！', el: '🛡️ Η Ασπίδα ενεργοποιήθηκε! Το σερί $1 σώθηκε!', 'zh-CN': '🛡️ 连胜护盾已生效！保住了你的 $1 连胜！', 'zh-TW': '🛡️ 連勝護盾已生效！保住了你的 $1 連勝！'
            }
        },
        {
            re: /^🏆\s*HAFTALIK\s*\((\d+)\/5\)$/,
            t: {
                en: '🏆 WEEKLY ($1/5)', de: '🏆 WOCHE ($1/5)', fr: '🏆 HEBDO ($1/5)', it: '🏆 SETTIMANA ($1/5)', es: '🏆 SEMANAL ($1/5)',
                pt: '🏆 SEMANAL ($1/5)', ru: '🏆 НЕДЕЛЯ ($1/5)', ja: '🏆 週間 ($1/5)', el: '🏆 ΕΒΔΟΜ. ($1/5)', 'zh-CN': '🏆 周赛 ($1/5)', 'zh-TW': '🏆 週賽 ($1/5)'
            }
        }
    ];

    let currentLang = 'tr';
    const originalTextMap = new WeakMap();
    const lastAppliedMap = new WeakMap();
    const originalAttrMap = new WeakMap();
    let isApplying = false;

    function loadSavedLang() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && LANGS.some(l => l.code === saved)) return saved;
        } catch (e) {}
        return 'tr';
    }

    function saveLang(code) {
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch (e) {}
    }

    function translateText(trText, lang) {
        if (!trText || lang === 'tr') return trText;
        const trimmed = trText.trim();
        if (!trimmed) return trText;

        const dict = DICT[lang];
        if (dict && dict.has(trimmed)) {
            return trText.replace(trimmed, dict.get(trimmed));
        }

        for (const p of PATTERNS) {
            if (p.re.test(trimmed)) {
                const tpl = p.t[lang];
                if (tpl) {
                    const replaced = trimmed.replace(p.re, tpl);
                    return trText.replace(trimmed, replaced);
                }
            }
        }
        return trText;
    }

    function shouldSkipNode(node) {
        const parent = node.parentElement;
        if (!parent) return true;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'INPUT') return true;
        if (parent.closest && parent.closest('#lang-list-grid')) return true;
        if (parent.id === 'btn-menu-lang' || parent.id === 'menu-player-name' || parent.id === 'editor-share-code' || parent.id === 'backup-code-box') return true;
        return false;
    }

    function processTextNode(node) {
        if (shouldSkipNode(node)) return;
        const val = node.nodeValue;
        if (!val || !val.trim()) return;

        let orig = originalTextMap.get(node);
        const lastApplied = lastAppliedMap.get(node);
        if (orig === undefined) {
            originalTextMap.set(node, val);
            orig = val;
        } else if (lastApplied !== undefined && val !== lastApplied) {
            // Game JS overwrote the node with fresh Turkish text; update our source cache
            originalTextMap.set(node, val);
            orig = val;
        }

        const nextVal = currentLang === 'tr' ? orig : translateText(orig, currentLang);
        lastAppliedMap.set(node, nextVal);
        if (node.nodeValue !== nextVal) {
            node.nodeValue = nextVal;
        }
    }

    function applyToDOM(root) {
        const target = root || document.body;
        if (!target) return;
        isApplying = true;
        try {
            const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
            let node;
            while ((node = walker.nextNode())) {
                processTextNode(node);
            }
            const langObj = LANGS.find(l => l.code === currentLang) || LANGS[0];
            const btn = document.getElementById('btn-menu-lang');
            if (btn) btn.textContent = `🌐 ${langObj.short}`;
            document.documentElement.lang = currentLang;
            if (document.title) {
                if (!originalAttrMap.has(document)) originalAttrMap.set(document, document.title);
                document.title = translateText(originalAttrMap.get(document), currentLang);
            }
        } finally {
            isApplying = false;
        }
    }

    function renderLangGrid() {
        const grid = document.getElementById('lang-list-grid');
        if (!grid) return;
        grid.innerHTML = '';
        LANGS.forEach(item => {
            const active = item.code === currentLang;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.langCode = item.code;
            btn.className = `flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-extrabold transition-all active:scale-95 ${
                active
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/80'
            }`;
            btn.innerHTML = `<span class="text-base leading-none">${item.flag}</span><span class="truncate">${item.name}</span>`;
            btn.addEventListener('click', () => {
                setLang(item.code);
                const modal = document.getElementById('lang-modal');
                if (modal) modal.classList.add('hidden');
            });
            grid.appendChild(btn);
        });
    }

    function setLang(code) {
        if (!LANGS.some(l => l.code === code)) return false;
        currentLang = code;
        saveLang(code);
        applyToDOM(document.body);
        renderLangGrid();
        return true;
    }

    function init() {
        currentLang = loadSavedLang();
        const openBtn = document.getElementById('btn-menu-lang');
        const closeBtn = document.getElementById('btn-close-lang');
        const modal = document.getElementById('lang-modal');

        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                renderLangGrid();
                modal.classList.remove('hidden');
            });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }

        renderLangGrid();
        applyToDOM(document.body);

        const observer = new MutationObserver((mutations) => {
            if (isApplying || currentLang === 'tr') return;
            isApplying = true;
            try {
                for (const m of mutations) {
                    if (m.type === 'characterData') {
                        processTextNode(m.target);
                    } else if (m.type === 'childList') {
                        m.addedNodes.forEach(n => {
                            if (n.nodeType === Node.TEXT_NODE) {
                                processTextNode(n);
                            } else if (n.nodeType === Node.ELEMENT_NODE) {
                                const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null);
                                let tn;
                                while ((tn = w.nextNode())) processTextNode(tn);
                            }
                        });
                    }
                }
            } finally {
                isApplying = false;
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    window.DevreI18n = {
        LANGS,
        getLang: () => currentLang,
        setLang,
        translateText,
        applyToDOM
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
