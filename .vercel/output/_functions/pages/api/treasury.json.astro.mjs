import fs from 'node:fs/promises';
import nodePath from 'node:path';
export { renderers } from '../../renderers.mjs';

function toHexBlock(blockNumber) {
  if (!Number.isFinite(blockNumber) || blockNumber < 0) throw new Error(`invalid blockNumber: ${blockNumber}`);
  return "0x" + blockNumber.toString(16);
}
async function rpcCall$1(rpcUrl, method, params, { timeoutMs = 2e4, retries = 3 } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: controller.signal
      });
      const text = await res.text();
      if (!res.ok) {
        lastErr = new Error(`rpc http ${res.status}: ${text}`);
        if (res.status === 429 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 250 * (attempt + 1) ** 2));
          continue;
        }
        throw lastErr;
      }
      const json = JSON.parse(text);
      if (json.error) {
        lastErr = new Error(`rpc ${method} error ${json.error.code}: ${json.error.message}`);
        const msg = `${json.error.code}:${json.error.message}`.toLowerCase();
        if ((msg.includes("rate") || msg.includes("over")) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 250 * (attempt + 1) ** 2));
          continue;
        }
        throw lastErr;
      }
      if (json.result === void 0) throw new Error(`rpc ${method} missing result`);
      return json.result;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

function strip0x(hex) {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}
function pad32(hexNo0x) {
  return hexNo0x.padStart(64, "0");
}
function padAddressTopic(address) {
  const a = strip0x(address).toLowerCase();
  if (a.length !== 40) throw new Error(`invalid address: ${address}`);
  return "0x" + "0".repeat(24) + a;
}
function decodeAddressTopic(topic) {
  const t = strip0x(topic);
  if (t.length !== 64) throw new Error(`invalid topic length: ${topic}`);
  return "0x" + t.slice(24).toLowerCase();
}
function hexToBigInt(hex) {
  const h = strip0x(hex);
  if (h === "") return 0n;
  return BigInt("0x" + h);
}
function readUint256(hex, offsetBytes) {
  const h = strip0x(hex);
  const start = offsetBytes * 2;
  const chunk = h.slice(start, start + 64);
  if (chunk.length !== 64) throw new Error("readUint256 out of range");
  return BigInt("0x" + chunk);
}
function decodeAbiString(resultHex) {
  const h = strip0x(resultHex);
  if (h.length === 64) {
    const bytes = Buffer.from(h, "hex");
    return bytes.toString("utf8").replace(/\u0000+$/g, "").trim();
  }
  if (h.length < 128) return "";
  const offset = Number(readUint256("0x" + h, 0));
  const len = Number(readUint256("0x" + h, offset));
  const dataStart = (offset + 32) * 2;
  const dataHex = h.slice(dataStart, dataStart + len * 2);
  try {
    return Buffer.from(dataHex, "hex").toString("utf8");
  } catch {
    return "";
  }
}
function encodeDecimalsCall() {
  return "0x313ce567";
}
function encodeSymbolCall() {
  return "0x95d89b41";
}
function encodeNameCall() {
  return "0x06fdde03";
}
function encodeBalanceOfCall(owner) {
  const o = strip0x(owner).toLowerCase();
  return "0x70a08231" + pad32(o);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
function defaultCachePath(projectRoot) {
  return nodePath.join(projectRoot, ".astro", "treasury", "cache.base.json");
}
async function loadCache(cachePath) {
  try {
    const txt = await fs.readFile(cachePath, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
async function saveCache(cachePath, state) {
  await ensureDir(nodePath.dirname(cachePath));
  await fs.writeFile(cachePath, JSON.stringify(state, null, 2) + "\n", "utf8");
}

const DEX_TOKEN_URL = "https://api.dexscreener.com/latest/dex/tokens/";
async function fetchDexPairsForToken(tokenAddress) {
  const url = `${DEX_TOKEN_URL}${tokenAddress}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`dexscreener http ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.pairs ?? [];
}
function pickBestBasePair(pairs) {
  const basePairs = pairs.filter((p) => (p.chainId ?? "").toLowerCase() === "base");
  if (!basePairs.length) return null;
  basePairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  return basePairs[0] ?? null;
}
function parseUsdPrice(p) {
  if (!p?.priceUsd) return null;
  const n = Number(p.priceUsd);
  return Number.isFinite(n) ? n : null;
}

const BASE_WETH = "0x4200000000000000000000000000000000000006";
const BASE_ANTIHUNTER = "0xe2f3fae4bc62e21826018364aa30ae45d430bb07";
const CHAINLINK_ETH_USD_FEED = "0x71041dddad3595f9ced3dccfbe3d1f4b0a16bb70";
const CHAINLINK_DECIMALS = "0x313ce567";
const CHAINLINK_LATEST_ROUND_DATA = "0xfeaf968c";
const TRANSFER_TOPIC0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
function formatUnits$1(raw, decimals) {
  const neg = raw < 0n;
  const v = neg ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const i = v / base;
  const f = v % base;
  if (f === 0n) return (neg ? "-" : "") + i.toString();
  let frac = f.toString().padStart(decimals, "0");
  frac = frac.replace(/0+$/g, "");
  return (neg ? "-" : "") + i.toString() + "." + frac;
}
function toNumberSafe(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
async function getChainId(rpcUrl) {
  const hex = await rpcCall$1(rpcUrl, "eth_chainId", []);
  return Number(BigInt(hex));
}
async function getLatestBlockNumber(rpcUrl) {
  const hex = await rpcCall$1(rpcUrl, "eth_blockNumber", []);
  return Number(BigInt(hex));
}
async function getBlockTimestamp(rpcUrl, blockNumber) {
  const block = await rpcCall$1(rpcUrl, "eth_getBlockByNumber", [toHexBlock(blockNumber), false]);
  return Number(BigInt(block.timestamp));
}
async function ethCall(rpcUrl, to, data) {
  return rpcCall$1(rpcUrl, "eth_call", [{ to, data }, "latest"]);
}
async function getErc20Decimals(rpcUrl, token) {
  const res = await ethCall(rpcUrl, token, encodeDecimalsCall());
  return Number(readUint256(res, 0));
}
async function getErc20BalanceRaw(rpcUrl, token, owner) {
  const res = await ethCall(rpcUrl, token, encodeBalanceOfCall(owner));
  return readUint256(res, 0);
}
async function getErc20Symbol(rpcUrl, token) {
  try {
    const res = await ethCall(rpcUrl, token, encodeSymbolCall());
    const s = decodeAbiString(res);
    return s || "TOKEN";
  } catch {
    return "TOKEN";
  }
}
async function getErc20Name(rpcUrl, token) {
  try {
    const res = await ethCall(rpcUrl, token, encodeNameCall());
    const s = decodeAbiString(res);
    return s || void 0;
  } catch {
    return void 0;
  }
}
function normalizeWeight(qtyRawAbs, decimals) {
  if (decimals === 18) return qtyRawAbs;
  if (decimals < 18) return qtyRawAbs * 10n ** BigInt(18 - decimals);
  return qtyRawAbs / 10n ** BigInt(decimals - 18);
}
async function getLogsChunk(rpcUrl, fromBlock, toBlock, topics, {
  addresses
} = {}) {
  try {
    return await rpcCall$1(rpcUrl, "eth_getLogs", [
      {
        fromBlock: toHexBlock(fromBlock),
        toBlock: toHexBlock(toBlock),
        // Many public Base RPCs restrict getLogs unless you specify address.
        ...addresses && addresses.length ? { address: addresses } : {},
        topics
      }
    ]);
  } catch (e) {
    throw e;
  }
}
async function scanTransfersIncremental(state, {
  maxChunkBlocks = 2e3,
  tokenAllowlist
} = {}) {
  const wallet = state.wallet.toLowerCase();
  const walletTopic = padAddressTopic(wallet);
  const latest = await getLatestBlockNumber(state.rpcUrl);
  if (state.lastScannedBlock >= latest) return;
  let from = state.lastScannedBlock + 1;
  while (from <= latest) {
    let to = Math.min(latest, from + maxChunkBlocks - 1);
    let ok = false;
    while (!ok) {
      try {
        const [incoming, outgoing] = await Promise.all([
          getLogsChunk(state.rpcUrl, from, to, [TRANSFER_TOPIC0, null, walletTopic], { addresses: tokenAllowlist }),
          getLogsChunk(state.rpcUrl, from, to, [TRANSFER_TOPIC0, walletTopic, null], { addresses: tokenAllowlist })
        ]);
        await processTransferLogs(state, [...incoming, ...outgoing]);
        state.lastScannedBlock = to;
        ok = true;
      } catch (e) {
        const span = to - from;
        if (span <= 10) throw e;
        to = from + Math.max(10, Math.floor(span / 2));
      }
    }
    from = state.lastScannedBlock + 1;
  }
}
async function processTransferLogs(state, logs) {
  if (!logs.length) return;
  logs.sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) || Number(BigInt(a.logIndex) - BigInt(b.logIndex)));
  const byTx = /* @__PURE__ */ new Map();
  for (const l of logs) {
    const h = l.transactionHash;
    const arr = byTx.get(h);
    if (arr) arr.push(l);
    else byTx.set(h, [l]);
  }
  for (const [txHash, txLogs] of byTx.entries()) {
    const deltas = /* @__PURE__ */ new Map();
    let blockNum = 0;
    for (const l of txLogs) {
      blockNum = Number(BigInt(l.blockNumber));
      if (l.topics[0]?.toLowerCase() !== TRANSFER_TOPIC0) continue;
      if (l.topics.length < 3) continue;
      const from = decodeAddressTopic(l.topics[1]);
      const to = decodeAddressTopic(l.topics[2]);
      const value = hexToBigInt(l.data);
      if (value === 0n) continue;
      let delta = 0n;
      if (to.toLowerCase() === state.wallet.toLowerCase()) delta += value;
      if (from.toLowerCase() === state.wallet.toLowerCase()) delta -= value;
      if (delta === 0n) continue;
      const token = l.address.toLowerCase();
      deltas.set(token, (deltas.get(token) ?? 0n) + delta);
    }
    if (!deltas.size) continue;
    const wethDelta = deltas.get(BASE_WETH.toLowerCase()) ?? 0n;
    const ahDelta = deltas.get(BASE_ANTIHUNTER.toLowerCase()) ?? 0n;
    let txValueWei = 0n;
    try {
      const tx = await rpcCall$1(state.rpcUrl, "eth_getTransactionByHash", [txHash]);
      txValueWei = tx?.value ? BigInt(tx.value) : 0n;
    } catch {
    }
    const tokenDeltas = [...deltas.entries()].filter(([token, d]) => token !== BASE_WETH.toLowerCase() && d !== 0n).map(([token, d]) => ({ token, delta: d }));
    if (!tokenDeltas.length) continue;
    for (const t of tokenDeltas) {
      const p = state.positions[t.token];
      if (!p || p.decimals === void 0) {
        const decimals = await getErc20Decimals(state.rpcUrl, t.token);
        const symbol = await getErc20Symbol(state.rpcUrl, t.token);
        const name = await getErc20Name(state.rpcUrl, t.token);
        state.positions[t.token] = {
          ...p ?? { qtyRaw: "0", costEthWei: "0", lots: [] },
          decimals,
          symbol,
          name,
          lots: p?.lots ?? []
        };
      }
    }
    const ethSpentWei = wethDelta < 0n ? -wethDelta : 0n;
    const ethReceivedWei = wethDelta > 0n ? wethDelta : 0n;
    const ahSpentRaw = ahDelta < 0n ? -ahDelta : 0n;
    const hasBuy = tokenDeltas.some((t) => t.delta > 0n);
    const hasSell = tokenDeltas.some((t) => t.delta < 0n);
    let ts;
    if (hasBuy) {
      try {
        ts = await getBlockTimestamp(state.rpcUrl, blockNum);
      } catch {
      }
    }
    if (ethSpentWei > 0n && hasBuy) {
      const received = tokenDeltas.filter((t) => t.delta > 0n);
      let totalWeight = 0n;
      for (const r of received) {
        const dec = state.positions[r.token].decimals ?? 18;
        totalWeight += normalizeWeight(r.delta, dec);
      }
      for (const r of received) {
        const st = state.positions[r.token];
        const dec = st.decimals ?? 18;
        const w = normalizeWeight(r.delta, dec);
        const alloc = totalWeight > 0n ? ethSpentWei * w / totalWeight : 0n;
        const prevQty = BigInt(st.qtyRaw);
        const prevCost = BigInt(st.costEthWei);
        st.qtyRaw = (prevQty + r.delta).toString();
        st.costEthWei = (prevCost + alloc).toString();
        st.lots ??= [];
        st.lots.push({ txHash, blockNumber: blockNum, timestamp: ts, qtyRaw: r.delta.toString(), costEthWei: alloc.toString() });
        if (!st.entryTimestamp && ts) {
          st.entryTimestamp = ts;
          st.entryBlock = blockNum;
        }
      }
    }
    if (ethSpentWei === 0n && txValueWei > 0n && hasBuy) {
      const received = tokenDeltas.filter((t) => t.delta > 0n);
      let totalWeight = 0n;
      for (const r of received) {
        const dec = state.positions[r.token].decimals ?? 18;
        totalWeight += normalizeWeight(r.delta, dec);
      }
      for (const r of received) {
        const st = state.positions[r.token];
        const dec = st.decimals ?? 18;
        const w = normalizeWeight(r.delta, dec);
        const alloc = totalWeight > 0n ? txValueWei * w / totalWeight : 0n;
        const prevQty = BigInt(st.qtyRaw);
        const prevCost = BigInt(st.costEthWei);
        st.qtyRaw = (prevQty + r.delta).toString();
        st.costEthWei = (prevCost + alloc).toString();
        st.lots ??= [];
        st.lots.push({ txHash, blockNumber: blockNum, timestamp: ts, qtyRaw: r.delta.toString(), costEthWei: alloc.toString() });
        if (!st.entryTimestamp && ts) {
          st.entryTimestamp = ts;
          st.entryBlock = blockNum;
        }
      }
    }
    if (hasBuy && ethSpentWei === 0n && txValueWei === 0n && ahSpentRaw > 0n) {
      let ahPxUsd;
      try {
        ahPxUsd = await getTokenPriceUsd(state, BASE_ANTIHUNTER.toLowerCase());
      } catch {
        ahPxUsd = void 0;
      }
      const ethPxUsd = await getEthPriceUsd(state);
      const ahDec = state.positions[BASE_ANTIHUNTER.toLowerCase()]?.decimals ?? 18;
      const ahSpent = toNumberSafe(formatUnits$1(ahSpentRaw, ahDec));
      const estCostEthWei = ahPxUsd !== void 0 && ethPxUsd !== void 0 && ethPxUsd > 0 ? BigInt(Math.floor(ahSpent * ahPxUsd / ethPxUsd * 1e18)) : 0n;
      const received = tokenDeltas.filter((t) => t.delta > 0n);
      let totalWeight = 0n;
      for (const r of received) {
        const dec = state.positions[r.token].decimals ?? 18;
        totalWeight += normalizeWeight(r.delta, dec);
      }
      for (const r of received) {
        const st = state.positions[r.token];
        const dec = st.decimals ?? 18;
        const w = normalizeWeight(r.delta, dec);
        const alloc = totalWeight > 0n ? estCostEthWei * w / totalWeight : 0n;
        const prevQty = BigInt(st.qtyRaw);
        const prevCost = BigInt(st.costEthWei);
        st.qtyRaw = (prevQty + r.delta).toString();
        st.costEthWei = (prevCost + alloc).toString();
        st.lots ??= [];
        st.lots.push({ txHash, blockNumber: blockNum, timestamp: ts, qtyRaw: r.delta.toString(), costEthWei: alloc.toString() });
        if (!st.entryTimestamp && ts) {
          st.entryTimestamp = ts;
          st.entryBlock = blockNum;
        }
      }
    }
    if (hasBuy && ethSpentWei === 0n && txValueWei === 0n && ahSpentRaw === 0n) {
      const received = tokenDeltas.filter((t) => t.delta > 0n);
      for (const r of received) {
        const st = state.positions[r.token];
        const prevQty = BigInt(st.qtyRaw);
        st.qtyRaw = (prevQty + r.delta).toString();
        st.lots ??= [];
        st.lots.push({ txHash, blockNumber: blockNum, timestamp: ts, qtyRaw: r.delta.toString(), costEthWei: "0" });
        if (!st.entryTimestamp && ts) {
          st.entryTimestamp = ts;
          st.entryBlock = blockNum;
        }
      }
    }
    if (ethReceivedWei > 0n && hasSell) {
      for (const s of tokenDeltas.filter((t) => t.delta < 0n)) {
        const st = state.positions[s.token];
        const prevQty = BigInt(st.qtyRaw);
        const prevCost = BigInt(st.costEthWei);
        const soldAbs = -s.delta;
        if (prevQty <= 0n) continue;
        const newQty = prevQty - soldAbs;
        const costReduction = prevCost * soldAbs / prevQty;
        const newCost = prevCost - costReduction;
        st.qtyRaw = (newQty < 0n ? 0n : newQty).toString();
        st.costEthWei = (newCost < 0n ? 0n : newCost).toString();
        if (st.lots?.length) {
          let remaining = soldAbs;
          const nextLots = [];
          for (const lot of st.lots) {
            if (remaining <= 0n) {
              nextLots.push(lot);
              continue;
            }
            const lotQty = BigInt(lot.qtyRaw);
            if (lotQty <= 0n) continue;
            if (remaining >= lotQty) {
              remaining -= lotQty;
              continue;
            }
            const keepQty = lotQty - remaining;
            const lotCost = BigInt(lot.costEthWei);
            const keepCost = lotQty > 0n ? lotCost * keepQty / lotQty : 0n;
            nextLots.push({ ...lot, qtyRaw: keepQty.toString(), costEthWei: keepCost.toString() });
            remaining = 0n;
          }
          st.lots = nextLots;
        }
        if (newQty <= 0n) {
          st.entryTimestamp = void 0;
          st.entryBlock = void 0;
          st.lots = [];
        }
      }
    }
  }
}
async function getEthPriceUsd(state) {
  const now = Date.now();
  if (state.ethPriceUsd && now - state.ethPriceUsd.updatedAtMs < 6e4) return state.ethPriceUsd.priceUsd;
  try {
    const pairs = await fetchDexPairsForToken(BASE_WETH);
    const best = pickBestBasePair(pairs);
    const px = parseUsdPrice(best);
    if (px !== null) {
      state.ethPriceUsd = { priceUsd: px, updatedAtMs: now };
      return px;
    }
  } catch {
  }
  return state.ethPriceUsd?.priceUsd;
}
async function getEthUsdFromChainlinkAtBlock(rpcUrl, blockNumber) {
  try {
    const [decHex, roundHex] = await Promise.all([
      rpcCall$1(rpcUrl, "eth_call", [{ to: CHAINLINK_ETH_USD_FEED, data: CHAINLINK_DECIMALS }, toHexBlock(blockNumber)]),
      rpcCall$1(rpcUrl, "eth_call", [{ to: CHAINLINK_ETH_USD_FEED, data: CHAINLINK_LATEST_ROUND_DATA }, toHexBlock(blockNumber)])
    ]);
    const decimals = Number(readUint256(decHex, 0));
    const answer = readUint256(roundHex, 32);
    const px = Number(answer) / 10 ** (Number.isFinite(decimals) ? decimals : 8);
    return Number.isFinite(px) ? px : void 0;
  } catch {
    return void 0;
  }
}
async function getTokenPriceUsd(state, token) {
  const now = Date.now();
  state.prices ??= {};
  const cached = state.prices[token];
  if (cached && now - cached.updatedAtMs < 6e4) return cached.priceUsd;
  try {
    const pairs = await fetchDexPairsForToken(token);
    const best = pickBestBasePair(pairs);
    const px = parseUsdPrice(best);
    if (px !== null) {
      state.prices[token] = { priceUsd: px, updatedAtMs: now };
      const base = best?.baseToken?.address?.toLowerCase();
      if (base && state.positions[base]) {
        state.positions[base].symbol ||= best?.baseToken?.symbol;
        state.positions[base].name ||= best?.baseToken?.name;
      }
      return px;
    }
  } catch {
  }
  return cached?.priceUsd;
}
async function getTreasurySnapshot({
  projectRoot,
  wallet,
  rpcUrl,
  startBlock,
  cacheTtlMs = 3e4,
  tokenAllowlist
}) {
  const cachePath = defaultCachePath(projectRoot);
  const chainId = await getChainId(rpcUrl);
  const now = Date.now();
  let state = await loadCache(cachePath);
  if (!state || state.version !== 4 || state.chainId !== chainId || state.wallet.toLowerCase() !== wallet.toLowerCase() || state.rpcUrl !== rpcUrl) {
    state = {
      version: 4,
      chainId,
      wallet: wallet.toLowerCase(),
      rpcUrl,
      startBlock,
      lastScannedBlock: startBlock - 1,
      updatedAtMs: 0,
      positions: {}
    };
  } else if (startBlock < state.startBlock) {
    state.startBlock = startBlock;
    state.lastScannedBlock = startBlock - 1;
    state.updatedAtMs = 0;
    state.positions = {};
    state.prices = void 0;
    state.ethPriceUsd = void 0;
  }
  const latest = await getLatestBlockNumber(rpcUrl);
  if (state.updatedAtMs && now - state.updatedAtMs < cacheTtlMs && state.lastScannedBlock >= latest) {
    const response = await buildResponseFromState(state);
    return response;
  }
  await scanTransfersIncremental(state, { tokenAllowlist });
  state.updatedAtMs = now;
  await saveCache(cachePath, state);
  return buildResponseFromState(state);
}
async function buildResponseFromState(state) {
  const notes = [];
  notes.push("Cost basis is inferred from on-chain ERC20 Transfer logs by pairing token in/out with WETH in/out within the same transaction.");
  notes.push("If treasury spends $ANTIHUNTER to acquire other tokens, we estimate cost basis by valuing $ANTIHUNTER at Dexscreener spot (non-historical approximation).");
  notes.push("Native ETH swaps are partially inferred via tx.value only (internal ETH transfers are not captured).");
  notes.push("Airdrops/transfers without WETH/ETH flow are ignored for cost basis.");
  notes.push("Cost basis USD is estimated using Chainlink ETH/USD at the entry block when available (falls back to current ETH/USD).");
  const ethPriceUsd = await getEthPriceUsd(state);
  const positions = [];
  const wallet = state.wallet.toLowerCase();
  const tokens = Object.keys(state.positions);
  const refreshed = /* @__PURE__ */ new Map();
  await Promise.all(
    tokens.map(async (token) => {
      try {
        refreshed.set(token, await getErc20BalanceRaw(state.rpcUrl, token, wallet));
      } catch {
      }
    })
  );
  for (const [token, st] of Object.entries(state.positions)) {
    if (token === BASE_WETH.toLowerCase()) continue;
    const qty = refreshed.get(token) ?? BigInt(st.qtyRaw);
    if (qty <= 0n) continue;
    const decimals = st.decimals ?? 18;
    const symbol = st.symbol ?? "TOKEN";
    const name = st.name;
    const balance = formatUnits$1(qty, decimals);
    const costEthWei = BigInt(st.costEthWei);
    const costEth = formatUnits$1(costEthWei, 18);
    const priceUsd = await getTokenPriceUsd(state, token);
    const balanceNum = toNumberSafe(balance);
    const fmvUsd = priceUsd !== void 0 ? balanceNum * priceUsd : void 0;
    let costEthUsd = ethPriceUsd;
    if (st.entryBlock !== void 0) {
      const atEntry = await getEthUsdFromChainlinkAtBlock(state.rpcUrl, st.entryBlock);
      if (atEntry !== void 0) costEthUsd = atEntry;
    }
    const costUsd = costEthUsd !== void 0 ? toNumberSafe(costEth) * costEthUsd : void 0;
    const pnlUsd = fmvUsd !== void 0 && costUsd !== void 0 ? fmvUsd - costUsd : void 0;
    const lots = [];
    for (const lot of st.lots ?? []) {
      const lotQty = BigInt(lot.qtyRaw);
      const lotCostWei = BigInt(lot.costEthWei);
      const lotCostEth = formatUnits$1(lotCostWei, 18);
      let lotEthUsd = ethPriceUsd;
      if (lot.blockNumber) {
        const atLot = await getEthUsdFromChainlinkAtBlock(state.rpcUrl, lot.blockNumber);
        if (atLot !== void 0) lotEthUsd = atLot;
      }
      lots.push({
        txHash: lot.txHash,
        blockNumber: lot.blockNumber,
        timestamp: lot.timestamp,
        qty: formatUnits$1(lotQty, decimals),
        qtyRaw: lot.qtyRaw,
        costEth: lotCostEth,
        costEthWei: lot.costEthWei,
        costUsd: lotEthUsd !== void 0 ? toNumberSafe(lotCostEth) * lotEthUsd : void 0
      });
    }
    const lotsQty = (st.lots ?? []).reduce((s, l) => s + BigInt(l.qtyRaw), 0n);
    const liveQty = qty;
    if (liveQty > lotsQty) {
      const diff = liveQty - lotsQty;
      lots.push({
        txHash: "unattributed",
        blockNumber: 0,
        timestamp: void 0,
        qty: formatUnits$1(diff, decimals),
        qtyRaw: diff.toString(),
        costEth: "0",
        costEthWei: "0",
        costUsd: 0
      });
    }
    positions.push({
      token,
      symbol,
      name,
      decimals,
      balance,
      balanceRaw: st.qtyRaw,
      entryTimestamp: st.entryTimestamp,
      costEth,
      costEthWei: st.costEthWei,
      costUsd,
      priceUsd,
      fmvUsd,
      pnlUsd,
      lots: lots.length ? lots : void 0
    });
  }
  positions.sort((a, b) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));
  return {
    chainId: state.chainId,
    wallet: state.wallet,
    lastScannedBlock: state.lastScannedBlock,
    updatedAtMs: state.updatedAtMs,
    wethAddress: BASE_WETH,
    ethPriceUsd,
    positions,
    notes
  };
}

const BASE_RPCS = [
  process.env.BASE_RPC_URL,
  process.env.BASE_RPC,
  "https://mainnet.base.org",
  "https://base.llamarpc.com",
  "https://base-rpc.publicnode.com"
].filter(Boolean);
async function rpcCall(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`rpc http ${res.status}: ${JSON.stringify(j)}`);
  if (j?.error) throw new Error(JSON.stringify(j));
  return j.result;
}
function formatUnits(raw, decimals) {
  const base = 10n ** BigInt(decimals);
  const i = raw / base;
  const f = raw % base;
  if (f === 0n) return i.toString();
  let frac = f.toString().padStart(decimals, "0").replace(/0+$/g, "");
  return `${i.toString()}.${frac}`;
}
async function erc20Meta(rpcUrl, token) {
  const [decHex, symHex, nameHex] = await Promise.all([
    rpcCall(rpcUrl, "eth_call", [{ to: token, data: encodeDecimalsCall() }, "latest"]),
    rpcCall(rpcUrl, "eth_call", [{ to: token, data: encodeSymbolCall() }, "latest"]).catch(() => null),
    rpcCall(rpcUrl, "eth_call", [{ to: token, data: encodeNameCall() }, "latest"]).catch(() => null)
  ]);
  const decimals = Number(readUint256(decHex, 0));
  const symbol = symHex ? decodeAbiString(symHex) : "";
  const name = nameHex ? decodeAbiString(nameHex) : "";
  return { decimals: Number.isFinite(decimals) ? decimals : 18, symbol: symbol || "TOKEN", name: name || void 0 };
}
async function erc20Balance(rpcUrl, token, owner) {
  const res = await rpcCall(rpcUrl, "eth_call", [{ to: token, data: encodeBalanceOfCall(owner) }, "latest"]);
  return readUint256(res, 0);
}
async function dexscreenerPriceUsd(token) {
  try {
    const pairs = await fetchDexPairsForToken(token);
    const best = pickBestBasePair(pairs);
    return parseUsdPrice(best);
  } catch {
    return null;
  }
}
const GET = async ({ url }) => {
  try {
    const wallet = (process.env.TREASURY_WALLET ?? "0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3").toLowerCase();
    let startBlock = Number(process.env.TREASURY_START_BLOCK ?? "41805000");
    if (!Number.isFinite(startBlock) || startBlock < 0) throw new Error("TREASURY_START_BLOCK must be a non-negative integer");
    const cacheTtlMs = Number(process.env.TREASURY_CACHE_TTL_MS ?? "60000");
    const refresh = url.searchParams.get("refresh");
    const projectRoot = process.env.VERCEL ? "/tmp" : process.cwd();
    let lastErr = null;
    for (const rpcUrl of BASE_RPCS) {
      try {
        const effectiveStartBlock = startBlock;
        const tokenAllowlist = [
          // canonical tokens we care about today (Base)
          "0xe2f3fae4bc62e21826018364aa30ae45d430bb07",
          // ANTIHUNTER
          "0x4200000000000000000000000000000000000006",
          // WETH
          "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
          // BNKR
          "0xf30bf00edd0c22db54c9274b90d2a4c21fc09b07",
          // FELIX
          "0xd655790b0486fa681c23b955f5ca7cd5f5c8cb07"
          // BIO
        ].map((a) => a.toLowerCase());
        const FEE_ENTRY_DATE = "2026-02-06";
        const ETH_ENTRY_DATE = "2026-02-07";
        const ZERO_COST = new Set([
          "0xe2f3fae4bc62e21826018364aa30ae45d430bb07",
          // ANTIHUNTER
          "0x4200000000000000000000000000000000000006"
          // WETH
        ].map((a) => a.toLowerCase()));
        async function ethBalance() {
          const hex = await rpcCall(rpcUrl, "eth_getBalance", [wallet, "latest"]);
          try {
            return Number(BigInt(hex)) / 1e18;
          } catch {
            return 0;
          }
        }
        const snapshot = await getTreasurySnapshot({
          projectRoot,
          wallet,
          rpcUrl,
          startBlock: effectiveStartBlock,
          cacheTtlMs: refresh ? 0 : cacheTtlMs,
          tokenAllowlist
        });
        const existing = new Set((snapshot.positions ?? []).map((p) => (p.token ?? "").toLowerCase()));
        for (const token of tokenAllowlist) {
          if (existing.has(token)) continue;
          const [meta, balRaw, px] = await Promise.all([
            erc20Meta(rpcUrl, token),
            erc20Balance(rpcUrl, token, wallet),
            dexscreenerPriceUsd(token)
          ]);
          if (balRaw <= 0n) continue;
          const balance = formatUnits(balRaw, meta.decimals);
          const balanceNum = Number(balance);
          const fmvUsd = px != null && Number.isFinite(balanceNum) ? balanceNum * px : void 0;
          const hardZero = ZERO_COST.has(token);
          snapshot.positions.push({
            token,
            symbol: meta.symbol,
            name: meta.name,
            decimals: meta.decimals,
            balance,
            balanceRaw: balRaw.toString(),
            entryTimestamp: hardZero ? Math.floor(new Date(FEE_ENTRY_DATE).getTime() / 1e3) : void 0,
            costEth: hardZero ? "0" : "0",
            costEthWei: hardZero ? "0" : "0",
            costUsd: hardZero ? 0 : void 0,
            priceUsd: px ?? void 0,
            fmvUsd,
            pnlUsd: hardZero && fmvUsd != null ? fmvUsd : void 0
          });
        }
        const ethQty = await ethBalance();
        const ethPx = await dexscreenerPriceUsd("0x4200000000000000000000000000000000000006");
        const ethFmvUsd = ethPx != null ? ethQty * ethPx : void 0;
        if ((ethFmvUsd ?? 0) >= 100) {
          const ethCostUsd = ethPx != null ? ethPx * 1 : void 0;
          snapshot.positions.push({
            token: null,
            symbol: "ETH",
            name: "Ethereum",
            decimals: 18,
            balance: String(ethQty),
            balanceRaw: "",
            entryTimestamp: Math.floor(new Date(ETH_ENTRY_DATE).getTime() / 1e3),
            costEth: "1",
            costEthWei: "1000000000000000000",
            costUsd: ethCostUsd,
            priceUsd: ethPx ?? void 0,
            fmvUsd: ethFmvUsd,
            pnlUsd: ethCostUsd != null ? ethFmvUsd - ethCostUsd : void 0
          });
        }
        snapshot.positions.sort((a, b) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));
        return new Response(JSON.stringify(snapshot, null, 2) + "\n", {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
          }
        });
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message ?? e);
        if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.includes("over rate limit")) {
          continue;
        }
        continue;
      }
    }
    throw lastErr ?? new Error("All RPC fallbacks failed");
  } catch (e) {
    return new Response(
      JSON.stringify(
        {
          error: e?.message ?? "Unknown error",
          hint: "Env: TREASURY_WALLET, TREASURY_START_BLOCK, BASE_RPC_URL, TREASURY_CACHE_TTL_MS. Add ?refresh=1 to force refresh. The API will fail over across multiple public Base RPCs when rate-limited."
        },
        null,
        2
      ) + "\n",
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
