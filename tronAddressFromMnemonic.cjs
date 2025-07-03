const bip39 = require('bip39');
const HDKey = require('hdkey');
const secp256k1 = require('secp256k1');
const { keccak256 } = require('js-sha3');
const bs58check = require('bs58check');

function deriveTronAddress(mnemonic, index = 0, passphrase = '') {
  const path = `m/44'/195'/0'/0/${index}`;
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  const master = HDKey.fromMasterSeed(seed);
  const child = master.derive(path);
  if (!child.privateKey) throw new Error('No private key derived');
  const privateKey = child.privateKey;
  const compressedPublicKey = child.publicKey;
  const uncompressedPublicKey = secp256k1.publicKeyConvert(compressedPublicKey, false).slice(1);
  const hash = keccak256.arrayBuffer(uncompressedPublicKey);
  const addressBytes = Buffer.concat([
    Buffer.from([0x41]),
    Buffer.from(hash).slice(-20)
  ]);
  const address = bs58check.encode(addressBytes);
  return { address, privateKey: privateKey.toString('hex'), path };
}

module.exports = { deriveTronAddress }; 