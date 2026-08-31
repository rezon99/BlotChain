# Бэклог Мажорных Фич и Архитектурные Предложения

В данном документе описаны мажорные архитектурные предложения, бэклог функционала и ответы на ключевые вопросы по развитию проекта BlotChain.

---

## 🔍 Ответы на ключевые вопросы архитектуры и интеграции

### 1. 🌐 Проверка работы API CoinGecko
Интеграция с CoinGecko API реализована в сервисе `src/services/coinGeckoApi.ts` и хуке `src/hooks/useRealTimeData.ts`:
- **Поддерживаемые эндпоинты:** `/ping`, `/coins/markets`, `/exchanges`, `/global`, `/coins/{id}/market_chart`.
- **Защита от Rate Limit (429):** При превышении лимитов (HTTP 429) или сетевых сбоях приложение автоматически переключается на генерацию реалистичных локальных данных (`generateMockNodes` & `generateMockConnections`), сохраняя полную функциональность UI и анимаций.
- **Инструмент автодиагностики:** Выполнить автоматическую проверку API CoinGecko в реальном времени можно с помощью утилиты:
  ```bash
  python3 /home/jules/self_created_tools/check_coingecko.py
  ```

---

### 2. 🔗 Как добавить данные Graph WL (Watchlist Subgraphs) в проекте?
В проект добавлен GraphQL сервис `src/services/graphApi.ts` для взаимодействия с **The Graph (Subgraphs)** и пользовательскими GraphQL эндпоинтами (Goldsky / Decentralized Network).

#### Инструкция по добавлению нового сабграфа в Watchlist (WL):
1. **Регистрация сабграфа в списке WL:**
   Добавьте новый сабграф в массив `DEFAULT_SUBGRAPH_WL` или динамически вызовите `graphApiService.addWatchlistSubgraph()`:
   ```typescript
   import { graphApiService } from './services/graphApi';

   graphApiService.addWatchlistSubgraph({
     id: 'uniswap-v3-polygon',
     name: 'Uniswap V3 Polygon Subgraph',
     endpointUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
     category: 'Uniswap',
     enabled: true
   });
   ```

2. **Запрос и маппинг сущностей:**
   Запросите данные сущностей (`pools`, `reserves`, `swaps`) через `graphApiService.query()` и преобразуйте их в модель `Node` и `Connection` для BlotChain:
   ```typescript
   const { nodes, connections } = await graphApiService.getDeFiGraphNodesAndConnections();
   ```

---

### 3. 📊 Какие данные онлайн можно брать с GraphQL для DeFi?

Используя GraphQL subgraphs (The Graph, Goldsky, Envoy), из блокчейна в режиме онлайн можно извлекать следующие категории данных:

| Категория DeFi | Источники / Subgraphs | Доступные онлайн-данные |
|---|---|---|
| **DEX / AMM Пулы** | Uniswap V2/V3, Curve, Balancer, Sushiswap | • Total Value Locked (TVL) по пулам и токенам<br>• Объем торгов за 24ч и комиссионные доходы<br>• Своп-события (Swaps: tokenIn, tokenOut, amount, sender)<br>• Распределение концентрированной ликвидности (Ticks) |
| **Lending / Borrowing** | Aave V3, Compound, Spark Protocol | • Общая сумма депозитов (`totalATokenSupply`) и займов<br>• Процентные ставки по депозитам и кредитам (`liquidityRate`, `variableBorrowRate`)• Доступная ликвидность и коэффициент утилизации (Utilization Rate)<br>• События ликвидаций (Liquidations) в реальном времени |
| **Yield & Staking** | Lido, RocketPool, Yearn, Convex | • Доходность валидаторов и APR стейкинга<br>• TVL хранилищ (Vaults) и распределение стратегий<br>• Награды за участие в голосовании (Gauges & Rewards) |
| **Cross-Chain / MEV** | Hop, Stargate, Flashbots | • Объемы мостов и кроссчейн-переводы<br>• События арбитража и сэндвич-атак в мемпуле |

---

### 4. 🎨 Предложение 3 типов Дашбордов

#### 🌊 Тип 1: DeFi Protocol & Liquidity Flow Dashboard (Дашборд Потоков Ликвидности DeFi)
- **Концепция:** Визуализация движения капитала между автоматическими маркетмейкерами (AMM) и протоколами кредитования (Lending).
- **Ключевые элементы:**
  - **Узлы (Nodes):** Ликвидные пулы Uniswap/Curve и резервы Aave/Compound.
  - **Связи (Connections):** Скорость и направление анимированных частиц соответствуют объему свопов, флеш-займов и перетоку капитала.
  - **Назначение:** Оценка ликвидности активов в DeFi и поиск оптимальных пулов для доходного фермерства.

#### 🛡️ Тип 2: MEV & Intent Threat Visualization Dashboard (Дашборд MEV и Угроз Интентов)
- **Концепция:** Мониторинг безопасности мемпула и визуализация MEV-векторов (сэндвич-атаки, фронтраннинг, проскальзывание).
- **Ключевые элементы:**
  - **Узлы (Nodes):** Транзакции и интенты пользователей в реальном времени.
  - **Связи (Connections):** Риск-индикаторы с пульсирующими красными кольцами угроз.
  - **Интеграция:** 1-Click чеканка NFT "Proof-of-Protection" в сети Polygon для защиты транзакций.
  - **Назначение:** Защита трейдеров от MEV-ботов и обеспечение прозрачности исполняемых интентов.

#### 🌐 Тип 3: Multi-Chain Asset & Portfolio Intelligence Dashboard (Дашборд Кросс-чейн Портфеля)
- **Концепция:** Мультичейн-агрегация портфеля и отслеживание распределения активов по сетям (Ethereum, Polygon, Arbitrum, Optimism, Solana).
- **Ключевые элементы:**
  - **Узлы (Nodes):** Токены пользователя и централизованные/децентрализованные биржи (CEX/DEX).
  - **Связи (Connections):** Мосты и кросс-чейн маршруты.
  - **Watchlist (WL):** Кастомные списки отслеживаемых токенов и фарминг-позиций.
  - **Назначение:** Полный обзор межсетевого баланса, структуры доходности и риска концентрации активов.
