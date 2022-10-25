import config from '../../config';
import { Contract, providers, utils, BigNumber as EthersBN } from 'ethers';

import NounsComposerABI from '../../libs/abi/NounsComposer.json';
import ComposableItemABI from '../../libs/abi/ComposableItem.json';
import ComposableItemFactoryABI from '../../libs/abi/ComposableItemFactory.json';
import ComposablesMarketABI from '../../libs/abi/ComposablesMarket.json';


const nounsComposerABI = new utils.Interface(NounsComposerABI);
const composableItemABI = new utils.Interface(ComposableItemABI);
const composableItemFactoryABI = new utils.Interface(ComposableItemFactoryABI);
const composablesMarketABI = new utils.Interface(ComposablesMarketABI);

const composablesMarketAddress = config.composables.composablesMarketProxy;


export interface CollectionCreatedEvent {
	collectionContract: string;
  	creator: string;
  	version: EthersBN;
  	name: string;
  	symbol: string;
  	nonce: EthersBN;
}

export interface ListingCreatedEvent {
	listingId: EthersBN;

    seller: string;
    tokenAddress: string;
    tokenId: EthersBN;
    
    price: EthersBN;
    quantity: EthersBN;
    maxPerAddress: EthersBN;		        
}

export interface ListingFilledEvent {
	listingId: EthersBN;

    buyer: string;
    tokenAddress: string;
    tokenId: EthersBN;
    
    seller: string;
    price: EthersBN;
    quantity: EthersBN;
}

export interface ListingDeletedEvent {
	listingId: EthersBN;
}

export interface ChildReceivedEvent {
	tokenId: EthersBN;

    from: string;
    childTokenAddress: string;
    childTokenId: EthersBN;    
    amount: EthersBN;
}

export interface ChildTransferredEvent {
	tokenId: EthersBN;

    to: string;
    childTokenAddress: string;
    childTokenId: EthersBN;    
    amount: EthersBN;
}

export interface TransferSingleEvent {
	operator: string;
	from: string;
	to: string;

	id: EthersBN;
    value: EthersBN;
}

export interface TokenMetadata {
  name: string;
  description: string;
  image: string;
}

export async function getComposedChildBatch(composerProxyAddress: string, tokenId: string, position1Start: number, position1End: number): Promise<any[]> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const nounsComposerContract = new Contract(
		composerProxyAddress,
		nounsComposerABI,
		jsonRpcProvider,
  	);

  	const tokenItems = await nounsComposerContract.getComposedChildBatch(tokenId, position1Start, position1End);
  	return tokenItems;
}

export async function getChildReceivedEvents(composerProxyAddress: string, tokenId: string): Promise<ChildReceivedEvent[]> {
	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const nounsComposerContract = new Contract(
		composerProxyAddress,
		nounsComposerABI,
		jsonRpcProvider,
  	);


	const eventFilter = nounsComposerContract.filters.ChildReceived(tokenId, null, null);
  	const events = await nounsComposerContract.queryFilter(eventFilter);
  	  	
  	const childReceived: ChildReceivedEvent[] = events.map(({ args }) => ({...args}) as ChildReceivedEvent );
  
	return childReceived;
}

export async function getChildTransferredEvents(composerProxyAddress: string, tokenId: string): Promise<ChildTransferredEvent[]> {
	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const nounsComposerContract = new Contract(
		composerProxyAddress,
		nounsComposerABI,
		jsonRpcProvider,
  	);


	const eventFilter = nounsComposerContract.filters.ChildTransferred(tokenId, null, null);
  	const events = await nounsComposerContract.queryFilter(eventFilter);
  	  	
  	const childTransferred: ChildTransferredEvent[] = events.map(({ args }) => ({...args}) as ChildTransferredEvent );
  
	return childTransferred;
}

export async function predictCollectionAddress(creatorAddress: string, nonce: number): Promise<string> {

	const composableItemFactoryAddress = config.composables.composableItemFactory;
	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemFactoryContract = new Contract(
		composableItemFactoryAddress,
		composableItemFactoryABI,
		jsonRpcProvider,
  	);

  	const tokenAddress = await composableItemFactoryContract.predictCollectionAddress(creatorAddress, nonce);
  	return tokenAddress;

}

export async function getCollectionCreatedEvents(): Promise<CollectionCreatedEvent[]> {

	const composableItemFactoryAddress = config.composables.composableItemFactory;
	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemFactoryContract = new Contract(
		composableItemFactoryAddress,
		composableItemFactoryABI,
		jsonRpcProvider,
	);

	const eventFilter = composableItemFactoryContract.filters.CollectionCreated();
  	const events = await composableItemFactoryContract.queryFilter(eventFilter);
  	  	
  	const collectionsCreated: CollectionCreatedEvent[] = events.map(({ args }) => ({...args}) as CollectionCreatedEvent );
  
	return collectionsCreated;
}

export async function getComposablePart(itemTokenAddress: string, itemTokenId: string): Promise<any | undefined> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	if (itemTokenAddress && itemTokenId) {

		const nounsComposableItemContract = new Contract(
			itemTokenAddress,
			composableItemABI,
			jsonRpcProvider,
	  	);

	  	const partBytes = await nounsComposableItemContract.getPartBytes(itemTokenId);
		return partBytes;

	}
}

export async function isApprovedForAll(collectionAddress: string, owner: string, operator: string): Promise<boolean> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const isApproved = await composableItemContract.isApprovedForAll(owner, operator);
  	return isApproved;
}


export async function getCollectionOwner(collectionAddress: string): Promise<string> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const name = await composableItemContract.owner();
  	return name;
}

export async function getCollectionName(collectionAddress: string): Promise<string> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const name = await composableItemContract.name();
  	return name;
}

export async function getCollectionSymbol(collectionAddress: string): Promise<string> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const symbol = await composableItemContract.symbol();
  	return symbol;
}


export async function getCollectionItemCount(collectionAddress: string): Promise<number> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const itemCount = await composableItemContract.getImageCount();
	return parseInt(itemCount.toString());
}

export async function getCollectionItemSVGBuffer(collectionAddress: string, tokenId: string): Promise<Buffer | undefined> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	if (collectionAddress && tokenId) {

		const composableItemContract = new Contract(
			collectionAddress,
			composableItemABI,
			jsonRpcProvider,
	  	);

	  	const dataURI = await composableItemContract.dataURI(tokenId);

	  	if (dataURI) {
			const data: TokenMetadata = JSON.parse(
			    Buffer.from(dataURI.substring(29), 'base64').toString('ascii'),
			);

			const svg = Buffer.from(data.image.substring(26), 'base64');
			return svg;
	  	}	
	}
}

export async function getCollectionPalette(collectionAddress: string): Promise<string[]> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const palettes = await composableItemContract.palettes(0);
	return palettes;
}

export async function getCollectionItemBytes(collectionAddress: string, tokenId: string): Promise<string> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const partBytes = await composableItemContract.getImageBytes(tokenId);
	return partBytes;
}

export async function getCollectionItemMeta(collectionAddress: string, tokenId: string): Promise<string> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		collectionAddress,
		composableItemABI,
		jsonRpcProvider,
  	);

  	const metaString = await composableItemContract.generateMeta(tokenId);
	return metaString;
}

export async function getTransferSingleEvents(tokenAddress: string, from: string | null, to: string | null): Promise<TransferSingleEvent[]> {
	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composableItemContract = new Contract(
		tokenAddress,
		composableItemABI,
		jsonRpcProvider,
	);

	const eventFilter = composableItemContract.filters.TransferSingle(null, from, to);
  	const events = await composableItemContract.queryFilter(eventFilter);
  	  	
  	const transferSingle: TransferSingleEvent[] = events.map(({ args }) => ({...args}) as TransferSingleEvent );
  
	return transferSingle;
}

/*
 * Marketplace contract calls
 */

export async function getListingCreatedEvents(): Promise<ListingCreatedEvent[]> {

	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composablesMarketContract = new Contract(
		composablesMarketAddress,
		composablesMarketABI,
		jsonRpcProvider,
	);

	const eventFilter = composablesMarketContract.filters.ListingCreated();
  	const events = await composablesMarketContract.queryFilter(eventFilter);
  	  	
  	const listingsCreated: ListingCreatedEvent[] = events.map(({ args }) => ({...args}) as ListingCreatedEvent );
  
	return listingsCreated;
}

export async function getListingFilledEvents(buyer?: string): Promise<ListingFilledEvent[]> {
	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composablesMarketContract = new Contract(
		composablesMarketAddress,
		composablesMarketABI,
		jsonRpcProvider,
	);

	const eventFilter = (buyer) ? composablesMarketContract.filters.ListingFilled(null, buyer, null, null) : composablesMarketContract.filters.ListingFilled();
  	const events = await composablesMarketContract.queryFilter(eventFilter);
  	  	
  	const listingsFilled: ListingFilledEvent[] = events.map(({ args }) => ({...args}) as ListingFilledEvent );
  
	return listingsFilled;
}

export async function getListingDeletedEvents(): Promise<ListingDeletedEvent[]> {

	
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	const composablesMarketContract = new Contract(
		composablesMarketAddress,
		composablesMarketABI,
		jsonRpcProvider,
	);

	const eventFilter = composablesMarketContract.filters.ListingDeleted();
  	const events = await composablesMarketContract.queryFilter(eventFilter);
  	  	
  	const listingsDeleted: ListingDeletedEvent[] = events.map(({ args }) => ({...args}) as ListingDeletedEvent );
  
	return listingsDeleted;
}