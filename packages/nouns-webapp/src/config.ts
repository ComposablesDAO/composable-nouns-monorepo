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

type SupportedChains = ChainId.Rinkeby | ChainId.Mainnet | ChainId.Hardhat;

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
    nftApiUri: '',
    subgraphApiUri: '',
    enableHistory: false,
  },
};

const externalAddresses: Record<SupportedChains, ExternalContractAddresses> = {
  [ChainId.Rinkeby]: {
    lidoToken: '0xF4242f9d78DB7218Ad72Ee3aE14469DBDE8731eD',
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

const composableExtensions: Record<SupportedChains, any> = {
  [ChainId.Rinkeby]: {
  	'extensions': [
	    {
	    	name: 'YOLONouns',
	    	address: '0xb632fD44053B09bddDaF92dE2C212bB12Ce8DbDF',
	    	imageDataUri: 'image-data-yolonouns.json',
	    	imageData: undefined,
	    },
	]
  },  
  [ChainId.Mainnet]: {
  	'extensions': [
	    {
	    	name: 'Nouns',
	    	address: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
	    	imageDataUri: '/image-data/image-data.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'LilNoun',
	    	address: '0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B',
	    	imageDataUri: '/image-data/image-data-lilnouns.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'YOLO Nouns',
	    	address: '0xB9e9053aB6dDd4f3FF717c1a22192D3517963A80',
	    	imageDataUri: '/image-data/image-data-yolonouns.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'NounsTown',
	    	address: '0xb632fD44053B09bddDaF92dE2C212bB12Ce8DbDF',
	    	imageDataUri: '/image-data/image-data-nounstown.json',
	    	imageData: undefined,
	    },
	    {
	    	name: 'nuNouns',
	    	address: '0x4c597608A1045ac3089B4683f2787AF8f991139D',
	    	imageDataUri: '/image-data/image-data-nunouns.json',
	    	imageData: undefined,
	    },	    
	    {
	    	name: 'FOODNOUNS',
	    	address: '0xF5331380e1d19757388A6E6198BF3BDc93D8b07a',
	    	imageDataUri: '/image-data/image-data-foodnouns.json',
	    	imageData: undefined,
	    },	    
	    
	]
  },
  [ChainId.Hardhat]: {
  	'extensions': [
	]
  },
};

const getComposables = (): any => {
  return composableExtensions[CHAIN_ID] ;
};


const config = {
  app: app[CHAIN_ID],
  addresses: getAddresses(),
  composables: getComposables(),
};

export default config;
