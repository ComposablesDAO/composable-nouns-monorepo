import * as contracts from './composablesContracts';
import * as indexer from './composablesIndexer';

import BigNumber from 'bignumber.js';
const isIndexer = indexer.isEnabled();
const router = (isIndexer) ? indexer : contracts;

export interface ComposableEncodedImage {
  filename: string;
  data: string;
  palette: string[];  
}

export interface ComposableItem {  
	collection: string;
  	meta: any;
  	image: ComposableEncodedImage;
  	  
    tokenAddress: string;
    tokenId: BigNumber;    
}

export interface ComposableItemCollection {
  	tokenAddress: string;
  	owner: string;
  	name: string;
  	symbol: string;
  
  	itemCount: number;
}

export interface ComposablesMarketListing {
	listingId: BigNumber;

    seller: string;
    tokenAddress: string;
    tokenId: BigNumber;
    
    price: BigNumber;
    quantity: BigNumber;
    maxPerAddress: BigNumber;		        
}

export interface TokenItem {  
    tokenAddress: string;
    tokenId: BigNumber;
    balance?: BigNumber;
}


export const filterComposableItemMarketListings = (listings: ComposablesMarketListing[], tokenAddress: string, tokenId: BigNumber): ComposablesMarketListing[] => {
  	if (listings) {
	  	const matches = listings.filter(listing => (listing.tokenAddress === tokenAddress && listing.tokenId.isEqualTo(tokenId)));
	  	return matches;
	} else {
		return [];
	}
}

export const filterComposableItemMarketListing = (listings: ComposablesMarketListing[], tokenAddress: string, tokenId: BigNumber): ComposablesMarketListing | undefined => {
  	if (listings) {
	  	const match = listings.find(listing => (listing.tokenAddress === tokenAddress && listing.tokenId.isEqualTo(tokenId)));
  		return match;
  	} else {
  		return undefined;
  	}
}

export const filterComposableItem = (composableItems: ComposableItem[], tokenAddress: string, tokenId: BigNumber): ComposableItem | undefined => {
  	if (composableItems) {
	  	const match = composableItems.find(item => (item.tokenAddress === tokenAddress && item.tokenId.isEqualTo(tokenId)));
  		return match;
  	} else {
  		return undefined;
  	}
}


export const filterTokenItem = (tokenItems: TokenItem[], tokenAddress: string, tokenId: BigNumber): TokenItem | undefined => {
  	if (tokenItems) {
	  	const match = tokenItems.find(item => (item.tokenAddress === tokenAddress && item.tokenId.isEqualTo(tokenId)));
  		return match;
  	} else {
  		return undefined;
  	}
}

export const filterComposableItemByAddress = (collectionItems: ComposableItem[] | undefined, tokenAddress: string) : ComposableItem[] | undefined => {
	if (collectionItems === undefined) {
  		return undefined;	
  	} else {
  		return collectionItems!.filter(item => (item.tokenAddress === tokenAddress));
	}
}

export const filterCollectionInfoByAddress = (collectionInfos: Record<string, any>[] | undefined, tokenAddress: string) : Record<string, any> | undefined => {
	if (collectionInfos === undefined) {
  		return undefined;	
  	} else {
		const match = collectionInfos.find(item => (item.tokenAddress === tokenAddress));
		return match;
	}
}

export async function indexComposableItemCollections(): Promise<boolean> {
	return (isIndexer) ? indexer.indexComposableItemCollections() : false;
}

export async function indexComposableItems(tokenAddress: string): Promise<boolean> {
	return (isIndexer) ? indexer.indexComposableItems(tokenAddress) : false;
}

export async function indexComposablesMarketListings(): Promise<boolean> {
	return (isIndexer) ? indexer.indexComposablesMarketListings() : false;
}

export async function getCollectionInfoBatch(limit: number): Promise<Record<string, any>[] | undefined> {
	return (isIndexer) ? indexer.getCollectionInfoBatch(limit) : undefined;
}

export async function getComposableItemCollections(full: boolean): Promise<ComposableItemCollection[]> {
	
	if (isIndexer) {
		return indexer.getCollections();
	}
	
	const collectionsCreated = await contracts.getCollectionCreatedEvents();

  	const collections: ComposableItemCollection[] = collectionsCreated.map(item => ({tokenAddress: item.collectionContract, owner: item.creator, name: item.name, symbol: item.symbol, itemCount: -1}) as ComposableItemCollection );
  	
  	if (full) {
    	for (let i = 0; i < collections.length; i++) {
    		
    		const tokenAddress = collections[i].tokenAddress;
			
		  	collections[i].owner = await contracts.getCollectionOwner(tokenAddress);
		  	collections[i].name = await contracts.getCollectionName(tokenAddress);
		  	collections[i].symbol = await contracts.getCollectionSymbol(tokenAddress);
		  	collections[i].itemCount = await contracts.getCollectionItemCount(tokenAddress);
		}
  	}
  
	return collections;
}

export async function getComposableItemCollection(tokenAddress: string): Promise<ComposableItemCollection> {

	if (isIndexer) {
		return indexer.getCollection(tokenAddress);
	}

	const owner = await contracts.getCollectionOwner(tokenAddress);
	const name = await contracts.getCollectionName(tokenAddress);
  	const symbol = await contracts.getCollectionSymbol(tokenAddress);
  	const count = await contracts.getCollectionItemCount(tokenAddress);
  	
  	const collection: ComposableItemCollection = {tokenAddress: tokenAddress, owner: owner, name: name, symbol: symbol, itemCount: count } as ComposableItemCollection;

	return collection;
}

export async function getComposableItemsBatch(collections: ComposableItemCollection[]): Promise<ComposableItem[]> {

	let items: ComposableItem[] = [];

	if (isIndexer) {
		const rows: Record<string, any>[] = await indexer.getComposableItemsRows(collections);

		for (let i = 0; i < rows.length; i++) {
			const row: Record<string, any> = rows[i];
			if (row.paletteRaw) {
				const item = prepareComposableItem(row.tokenAddress, row.tokenId, row.collectionName, row.paletteRaw, row.imageBytes, row.metaGenerated);
				items.push(item);
			}
		}
		
		return items;
	}

	
	for (let i = 0; i < collections.length; i++) {
		const cItems = await getComposableItems(collections[i].tokenAddress, collections[i].itemCount, collections[i].name);
		items = items.concat(cItems);
	}
	
	return items;
}

//get collection name out of here...
export async function getComposableItems(tokenAddress: string, itemCount: number, collectionName: string): Promise<ComposableItem[]> {
	const items: ComposableItem[] = [];

	if (itemCount === 0) {
		return items;
	}

	//first, get the palette
	const paletteRaw = await router.getCollectionPalette(tokenAddress);

	for (let i = 0; i < itemCount; i++) {
		const data = await router.getCollectionItemImageBytes(tokenAddress, i.toString());
		const meta = await router.getCollectionItemMetaGenerated(tokenAddress, i.toString());
		
		if (data && meta) {				
			const item = prepareComposableItem(tokenAddress, i, collectionName, paletteRaw, data, meta);
			items.push(item);
		}
	}
	
	return items;					  		  
}

export const prepareComposableItem = (tokenAddress: string, tokenId: number, collectionName: string, paletteRaw: string, imageBytes: string, metaGenerated: string) : ComposableItem => {

    const paletteReg = paletteRaw.substring(2).match(/.{1,6}/g);
    const palette: string[] = paletteReg!.map(reg => (reg.toString()) as string );

	const json = JSON.parse("{" + metaGenerated + "}");

	//should check these and not just assume...	
	const category = json.attributes[0].value;
	const creator = json.attributes[1].value;
	
	const filename = creator + "-" + category + "-" + json.name;
	
	json.category = category;
	json.creator = creator;
	
	const image: ComposableEncodedImage = {filename: filename, data: imageBytes, palette: palette};
	const item: ComposableItem = { meta: json, image: image,
		collection: collectionName, tokenAddress: tokenAddress, tokenId: new BigNumber(tokenId) };
	
	return item;
}

export async function getTokenHoldings(tokenAddress: string, holder: string): Promise<TokenItem[]> {
	
	const transferIn = await contracts.getTransferSingleEvents(tokenAddress, null, holder);
	const transferOut = await contracts.getTransferSingleEvents(tokenAddress, holder, null);

	const holdings: TokenItem[] = [];

	for (let i = 0; i < transferIn.length; i++) {
		
		const tokenId = new BigNumber(transferIn[i].id.toString());
		const amount = new BigNumber(transferIn[i].value.toString());
		
		const index = holdings.findIndex(holding => (holding.tokenId.isEqualTo(tokenId)));
		if (index > -1) {
			holdings[index].balance = holdings[index].balance!.plus(amount);
		} else {
			holdings.push({tokenAddress: tokenAddress, tokenId: tokenId, balance: amount});
		}
	}

	for (let i = 0; i < transferOut.length; i++) {
		
		const tokenId = new BigNumber(transferOut[i].id.toString());
		const amount = new BigNumber(transferOut[i].value.toString());

		const index = holdings.findIndex(holding => (holding.tokenId.isEqualTo(tokenId)));
		if (index > -1) {
			holdings[index].balance = holdings[index].balance!.minus(amount);
		} else {
			console.log('Error: Mismatched transfer single data.', tokenAddress);
		}
	}	
	
	return holdings.filter(holding => (holding.balance!.isGreaterThan(new BigNumber(0))));
}


export async function getComposablesMarketListings(): Promise<ComposablesMarketListing[]> {
	
	const listingsCreated = await router.getListingCreatedEvents();
	const listingsDeleted = await router.getListingDeletedEvents();

	const listingsFiltered = listingsCreated.filter(listing => (!listingsDeleted.find(deleted => (deleted.listingId.toString() === listing.listingId.toString()))));

  	const listings: ComposablesMarketListing[] = listingsFiltered.map(item => ({
  		listingId: new BigNumber(item.listingId.toString()),

  		seller: item.seller, 
  		tokenAddress: item.tokenAddress, 
  		tokenId: new BigNumber(item.tokenId.toString()), 

		price: new BigNumber(item.price.toString()), 
		quantity: new BigNumber(item.quantity.toString()), 
		maxPerAddress: new BigNumber(item.maxPerAddress.toString())
		
  		}) as ComposablesMarketListing );
  
	return listings;
}

export async function getComposedChildBatch(composerProxyAddress: string, tokenId: string, position1Start: number, position1End: number): Promise<TokenItem[]> {

	const children = await contracts.getComposedChildBatch(composerProxyAddress, tokenId, position1Start, position1End);

  	const items: TokenItem[] = children.map(item => ({
  		tokenAddress: item.tokenAddress, 
  		tokenId: new BigNumber(item.tokenId.toString())
  		}) as TokenItem );

	return items;
}

export async function getChildTokens(composerProxyAddress: string, tokenId: string): Promise<TokenItem[]> {

	const received = await contracts.getChildReceivedEvents(composerProxyAddress, tokenId);
	const transferred = await contracts.getChildTransferredEvents(composerProxyAddress, tokenId);
	
	const children: TokenItem[] = [];
	
	for (let i = 0; i < received.length; i++) {
		
		const childTokenAddress = received[i].childTokenAddress;
		const childTokenId = new BigNumber(received[i].childTokenId.toString());
		const amount = new BigNumber(received[i].amount.toString());
		
		const index = children.findIndex(child => (child.tokenAddress === childTokenAddress && child.tokenId.isEqualTo(childTokenId)));
		if (index > -1) {
			children[index].balance = children[index].balance!.plus(amount);
		} else {
			children.push({tokenAddress: childTokenAddress, tokenId: childTokenId, balance: amount});
		}
	}

	for (let i = 0; i < transferred.length; i++) {
		
		const childTokenAddress = transferred[i].childTokenAddress;
		const childTokenId = new BigNumber(transferred[i].childTokenId.toString());
		const amount = new BigNumber(transferred[i].amount.toString());

		const index = children.findIndex(child => (child.tokenAddress === childTokenAddress && child.tokenId.isEqualTo(childTokenId)));
		if (index > -1) {
			children[index].balance = children[index].balance!.minus(amount);
		} else {
			console.log('Error: Mismatched receive/transfer child data.', composerProxyAddress, tokenId);
		}
	}	
	
	return children.filter(child => (child.balance!.isGreaterThan(new BigNumber(0))));
}