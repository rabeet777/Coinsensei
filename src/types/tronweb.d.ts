declare module 'tronweb' {
  export default class TronWeb {
    constructor(options: {
      fullNode: string;
      solidityNode: string;
      eventServer: string;
      headers?: { [key: string]: string };
    });
    
    transactionBuilder: {
      triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: { feeLimit: number; callValue: number },
        parameters: Array<{ type: string; value: string }>,
        issuerAddress: string
      ): Promise<{
        result: boolean;
        transaction: any;
      }>;
    };
    
    trx: {
      sign(transaction: any, privateKey: string): Promise<any>;
      sendRawTransaction(signedTransaction: any): Promise<{
        result: boolean;
        txid?: string;
        message?: string;
      }>;
    };
    
    defaultAddress: {
      base58: string;
    };
  }
} 