"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/depositListener.ts
var dotenv_1 = require("dotenv");
var node_fetch_1 = require("node-fetch");
var supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config({ path: '.env.local' });
// ─── 1) Load & validate env vars ───────────────────────────────────────────
var _a = process.env, TRON_FULL_HOST = _a.TRON_FULL_HOST, TRON_API_KEY = _a.TRON_API_KEY, NEXT_PUBLIC_SUPABASE_URL = _a.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY = _a.SUPABASE_SERVICE_ROLE_KEY;
if (!TRON_FULL_HOST ||
    !NEXT_PUBLIC_SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing one of TRON_FULL_HOST, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
// ─── 2) Supabase admin client ────────────────────────────────────────────────
var supabase = (0, supabase_js_1.createClient)(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// ─── 3) Poll interval ────────────────────────────────────────────────────────
var POLL_INTERVAL = 15000;
// ─── 4) Helpers to pull fields out of the RPC JSON ─────────────────────────
function extractAddress(tx) {
    var _a, _b, _c, _d;
    return ((_d = (_c = (_b = (_a = tx.to_address) !== null && _a !== void 0 ? _a : tx.toAddress) !== null && _b !== void 0 ? _b : tx.transferToAddress) !== null && _c !== void 0 ? _c : tx.to) !== null && _d !== void 0 ? _d : null);
}
function extractTxId(tx) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = tx.transaction_id) !== null && _a !== void 0 ? _a : tx.transactionId) !== null && _b !== void 0 ? _b : tx.txID) !== null && _c !== void 0 ? _c : null);
}
function extractValue(tx) {
    var _a, _b;
    return ((_b = (_a = tx.value) !== null && _a !== void 0 ? _a : tx.amount) !== null && _b !== void 0 ? _b : null);
}
// ─── 5) The main polling loop ───────────────────────────────────────────────
function pollDeposits() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rows, error, _i, rows_1, row, address, user_id, oldBal, currentBal, baseUrl, url, headers, body, res, e_1, _b, _c, tx, toAddr, txId, rawVal, amount, txErr, bErr;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("\n\uD83D\uDD0D pollDeposits @ ".concat(new Date().toISOString()));
                    return [4 /*yield*/, supabase
                            .from('user_wallets')
                            .select('address, user_id, balance')];
                case 1:
                    _a = _d.sent(), rows = _a.data, error = _a.error;
                    if (error) {
                        console.error('DB error fetching wallets:', error);
                        return [2 /*return*/];
                    }
                    if (!(rows === null || rows === void 0 ? void 0 : rows.length)) {
                        console.log('⚠️  No wallets to poll');
                        return [2 /*return*/];
                    }
                    console.log("\u2139\uFE0F  Polling ".concat(rows.length, " wallets"));
                    _i = 0, rows_1 = rows;
                    _d.label = 2;
                case 2:
                    if (!(_i < rows_1.length)) return [3 /*break*/, 13];
                    row = rows_1[_i];
                    address = row.address;
                    user_id = row.user_id;
                    oldBal = row.balance == null ? 0 : Number(row.balance) || 0;
                    currentBal = oldBal;
                    console.log("\u27A1\uFE0F  ".concat(address, " (balance=").concat(oldBal, ")"));
                    baseUrl = TRON_FULL_HOST.replace(/\/+$/, '');
                    url = "".concat(baseUrl, "/v1/accounts/").concat(address, "/transactions/trc20?only_confirmed=true&limit=100");
                    headers = {};
                    if (TRON_API_KEY)
                        headers['TRON-PRO-API-KEY'] = TRON_API_KEY;
                    body = void 0;
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, (0, node_fetch_1.default)(url, { headers: headers })];
                case 4:
                    res = _d.sent();
                    console.log("   \uD83D\uDD04 HTTP ".concat(res.status));
                    return [4 /*yield*/, res.json()];
                case 5:
                    body = _d.sent();
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _d.sent();
                    console.error("   \uD83D\uDCA5 Network error for ".concat(address, ":"), e_1);
                    return [3 /*break*/, 12];
                case 7:
                    if (!Array.isArray(body.data)) {
                        console.error("   \uD83D\uDCA5 Unexpected response for ".concat(address, ":"), body);
                        return [3 /*break*/, 12];
                    }
                    console.log("   \uD83D\uDD0D ".concat(body.data.length, " TRC-20 tx(s) returned"));
                    _b = 0, _c = body.data;
                    _d.label = 8;
                case 8:
                    if (!(_b < _c.length)) return [3 /*break*/, 12];
                    tx = _c[_b];
                    toAddr = extractAddress(tx);
                    if (toAddr !== address)
                        return [3 /*break*/, 11];
                    txId = extractTxId(tx);
                    rawVal = extractValue(tx);
                    if (!txId || !rawVal) {
                        console.warn("   \u26A0\uFE0F  Skipping malformed tx:", tx);
                        return [3 /*break*/, 11];
                    }
                    amount = Number(rawVal) / 1e6;
                    return [4 /*yield*/, supabase
                            .from('processed_txs')
                            .insert({ tx_id: txId, user_id: user_id, amount: amount })];
                case 9:
                    txErr = (_d.sent()).error;
                    if (txErr) {
                        // duplicate? already handled
                        if (txErr.code !== '23505') {
                            console.error("   \uD83D\uDCA5 Error inserting ".concat(txId, ":"), txErr);
                        }
                        return [3 /*break*/, 11];
                    }
                    console.log("   \u2705 Recorded tx ".concat(txId, " +").concat(amount));
                    // 5b) Roll-forward and update balance
                    currentBal += amount;
                    return [4 /*yield*/, supabase
                            .from('user_wallets')
                            .update({ balance: currentBal })
                            .eq('address', address)];
                case 10:
                    bErr = (_d.sent()).error;
                    if (bErr) {
                        console.error("   \uD83D\uDCA5 Error updating balance for ".concat(address, ":"), bErr);
                    }
                    else {
                        console.log("   \uD83E\uDE99 Credited ".concat(amount, "; new balance ").concat(currentBal));
                    }
                    _d.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 8];
                case 12:
                    _i++;
                    return [3 /*break*/, 2];
                case 13: return [2 /*return*/];
            }
        });
    });
}
// ─── 6) Entrypoint ──────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDD04 Starting TRC-20 deposit poll every ".concat(POLL_INTERVAL / 1000, "s\u2026"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, pollDeposits()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('❌ Initial pollDeposits() failed:', err_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4:
                    setInterval(pollDeposits, POLL_INTERVAL);
                    return [2 /*return*/];
            }
        });
    });
}
main();
