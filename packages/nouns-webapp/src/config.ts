import {
  ContractAddresses as NounsContractAddresses,
  getContractAddressesForChainOrThrow,
} from '@nouns/sdk';
import { ChainId } from '@usedapp/core';

interface ExternalContractAddresses {
  lidoToken: string | undefined;
}

export type ContractAddresses = NounsContractAddresses & ExternalContractAddresses;

interface AppConfig {
  jsonRpcUri: string;
  wsRpcUri: string;
  nftApiUri: string;
  subgraphApiUri: string;
  enableHistory: boolean;
}

type SupportedChains = ChainId.Rinkeby | ChainId.Mainnet | ChainId.Hardhat | ChainId.Goerli;

interface CacheBucket {
  name: string;
  version: string;
}

export const cache: Record<string, CacheBucket> = {
  seed: {
    name: 'seed',
    version: 'v1',
  },
  ens: {
    name: 'ens',
    version: 'v1',
  },
};

export const cacheKey = (bucket: CacheBucket, ...parts: (string | number)[]) => {
  return [bucket.name, bucket.version, ...parts].join('-').toLowerCase();
};

export const CHAIN_ID: SupportedChains = parseInt(process.env.REACT_APP_CHAIN_ID ?? '4');

export const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY ?? '';

const INFURA_PROJECT_ID = process.env.REACT_APP_INFURA_PROJECT_ID;

export const createNetworkHttpUrl = (network: string): string => {
  const custom = process.env[`REACT_APP_${network.toUpperCase()}_JSONRPC`];
  return custom || `https://${network}.infura.io/v3/${INFURA_PROJECT_ID}`;
};

export const createNetworkWsUrl = (network: string): string => {
  const custom = process.env[`REACT_APP_${network.toUpperCase()}_WSRPC`];
  return custom || `wss://${network}.infura.io/ws/v3/${INFURA_PROJECT_ID}`;
};

export const createNetworkApiUrl = (network: string): string => {
  const custom = process.env[`REACT_APP_${network.toUpperCase()}_NFTAPI`];
  return custom || ``;
};


const app: Record<SupportedChains, AppConfig> = {
  [ChainId.Rinkeby]: {
    jsonRpcUri: createNetworkHttpUrl('rinkeby'),
    wsRpcUri: createNetworkWsUrl('rinkeby'),
    nftApiUri: createNetworkApiUrl('rinkbey'),
    subgraphApiUri: 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph-rinkeby-v5',
    enableHistory: process.env.REACT_APP_ENABLE_HISTORY === 'true',
  },
  [ChainId.Goerli]: {
    jsonRpcUri: createNetworkHttpUrl('goerli'),
    wsRpcUri: createNetworkWsUrl('goerli'),
    nftApiUri: createNetworkApiUrl('goerli'),
    subgraphApiUri: 'https://api.thegraph.com/subgraphs/name/composablesdao/goerli',
    enableHistory: process.env.REACT_APP_ENABLE_HISTORY === 'true',
  },
  [ChainId.Mainnet]: {
    jsonRpcUri: createNetworkHttpUrl('mainnet'),
    wsRpcUri: createNetworkWsUrl('mainnet'),
    nftApiUri: createNetworkApiUrl('mainnet'),
    subgraphApiUri: 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph',
    enableHistory: process.env.REACT_APP_ENABLE_HISTORY === 'true',
  },
  [ChainId.Hardhat]: {
    jsonRpcUri: 'http://localhost:8545',
    wsRpcUri: 'ws://localhost:8545',
    nftApiUri: 'http://localhost:8888/image-data/mock-api.json?',
    subgraphApiUri: 'http://localhost:8000/subgraphs/name/nounsdao/nouns-subgraph',
    enableHistory: process.env.REACT_APP_ENABLE_HISTORY === 'true',
  },
};

const externalAddresses: Record<SupportedChains, ExternalContractAddresses> = {
  [ChainId.Rinkeby]: {
    lidoToken: '0xF4242f9d78DB7218Ad72Ee3aE14469DBDE8731eD',
  },
  [ChainId.Goerli]: {
    lidoToken: '0x2DD6530F136D2B56330792D46aF959D9EA62E276',
  },
  [ChainId.Mainnet]: {
    lidoToken: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  },
  [ChainId.Hardhat]: {
    lidoToken: undefined,
  },
};

const getAddresses = (): ContractAddresses => {
  let nounsAddresses = {} as NounsContractAddresses;
  try {
    nounsAddresses = getContractAddressesForChainOrThrow(CHAIN_ID);
  } catch {}
  return { ...nounsAddresses, ...externalAddresses[CHAIN_ID] };
};

const composableTokens: Record<SupportedChains, any> = {
  [ChainId.Rinkeby]: {
  	extensions: [
	    {
	    	name: 'YOLONouns',
	    	tokenAddress: '0xb632fD44053B09bddDaF92dE2C212bB12Ce8DbDF',
	    	imageDataUri: 'image-data-yolonouns.json',
	    	imageData: undefined,
	    },
	]
  },  
  [ChainId.Goerli]: {
  	extensions: [
	    {
	    	name: 'CX Nouns',
	    	tokenAddress: '0x985F822285D688d05AD71D739A1b7B3116920f8D',
	    	composerProxy: '0x14edab8509827481460ad77cf72674bE22165039',
	    	imageDataUri: '/image-data/image-data.json',
	    	imageData: undefined,
	    },
	],
	composablesMarketProxy: '0x29A42a147d0843Ee7133d5941Ef257DE5a3c41E7',
	composableItemFactory: '0x70014590c56BDa28577e651A0b3953d4371B8a32',
  	items: [
	    {
	    	name: 'Starter Pack',
	    	address: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
	    	imageDataUri: '/image-data/image-data-composables.json',
	    	imageData: undefined,
	    },
	]	
  },  
  [ChainId.Mainnet]: {
  	extensions: [
	    {
	    	name: 'Nouns',
	    	tokenAddress: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
	    	imageDataUri: '/image-data/image-data.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'LilNoun',
	    	tokenAddress: '0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B',
	    	imageDataUri: '/image-data/image-data-lilnouns.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'YOLO Nouns',
	    	tokenAddress: '0xB9e9053aB6dDd4f3FF717c1a22192D3517963A80',
	    	imageDataUri: '/image-data/image-data-yolonouns.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'NounsTown',
	    	tokenAddress: '0xb632fD44053B09bddDaF92dE2C212bB12Ce8DbDF',
	    	imageDataUri: '/image-data/image-data-nounstown.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'nuNouns',
	    	tokenAddress: '0x4c597608A1045ac3089B4683f2787AF8f991139D',
	    	imageDataUri: '/image-data/image-data-nunouns.json',
	    	imageData: undefined,
	    },	    
	    {
	    	name: 'FOODNOUNS',
	    	tokenAddress: '0xF5331380e1d19757388A6E6198BF3BDc93D8b07a',
	    	imageDataUri: '/image-data/image-data-foodnouns.json',
	    	imageData: undefined,
	    },	    
	    
	]
  },
  [ChainId.Hardhat]: {
  	extensions: [
	    {
	    	name: 'Nouns',
	    	tokenAddress: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
	    	composerProxy: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
	    	imageDataUri: '/image-data/image-data.json',
	    	imageData: undefined,
	    },
	],
	composablesMarketProxy: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
	composableItemFactory: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
  	items: [
	    {
	    	name: 'Starter Pack',
	    	address: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
	    	imageDataUri: '/image-data/image-data-composables.json',
	    	imageData: undefined,
	    },
	]	
  },
};

const getComposables = (): any => {
  return composableTokens[CHAIN_ID] ;
};


const config = {
  app: app[CHAIN_ID],
  addresses: getAddresses(),
  composables: getComposables(),
  indexer: { 
	  host: process.env.REACT_APP_DATABASE_HOST,
	  username: process.env.REACT_APP_DATABASE_USERNAME,
	  password: process.env.REACT_APP_DATABASE_PASSWORD
  	}
};

export default config;

export const multicallOnLocalhost = '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE'; //0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
