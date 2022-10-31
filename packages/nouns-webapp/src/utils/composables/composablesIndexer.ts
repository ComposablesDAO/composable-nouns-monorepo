import config from '../../config';
import * as contracts from './composablesContracts';
//import * as wrapper from './composablesWrapper';
import { CollectionCreatedEvent, ListingCreatedEvent, ListingDeletedEvent } from './composablesContracts';
import { ComposableItemCollection } from './composablesWrapper';
import { connect } from '@planetscale/database'

const configIndexer = config.indexer;	

export const isEnabled = () : boolean => {
	return (configIndexer.host !== undefined);
}

/*
 * Indexer get functions
 */

export async function getCollectionCreatedEvents(): Promise<CollectionCreatedEvent[]> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT * FROM events_collection_created');
  	  	
  	const collectionsCreated: CollectionCreatedEvent[] = results.rows.map(row => ({...row}) as CollectionCreatedEvent );
  
	return collectionsCreated;
}

export async function getListingCreatedEvents(): Promise<ListingCreatedEvent[]> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT * FROM events_listing_created');
  	  	
  	const listingsCreated: ListingCreatedEvent[] = results.rows.map(row => ({...row}) as ListingCreatedEvent );
  
	return listingsCreated;
}

export async function getListingDeletedEvents(): Promise<ListingDeletedEvent[]> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT * FROM events_listing_deleted');
  	  	
  	const listingsDeleted: ListingDeletedEvent[] = results.rows.map(row => ({...row}) as ListingDeletedEvent );
  
	return listingsDeleted;
}

export async function getCollection(collectionAddress: string): Promise<ComposableItemCollection | undefined> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT tokenAddress, owner, name, symbol, itemCount FROM collections WHERE tokenAddress = ?', [collectionAddress], { as: 'object' });
	
	const collections: ComposableItemCollection[] = results.rows.map(row => ({...row}) as ComposableItemCollection );
	
	if (collections.length > 0) {
		return collections[0];
	}
}


export async function getCollectionOwner(collectionAddress: string): Promise<string> {
	const collection = await getCollection(collectionAddress);	

	if (collection) {
		return collection.owner;
	}
	return '';
}

export async function getCollectionName(collectionAddress: string): Promise<string> {
	const collection = await getCollection(collectionAddress);	

	if (collection) {
		return collection.name;
	}
	return '';
}

export async function getCollectionSymbol(collectionAddress: string): Promise<string> {
	const collection = await getCollection(collectionAddress);	

	if (collection) {
		return collection.symbol;
	}
	return '';
}

export async function getCollectionItemCount(collectionAddress: string): Promise<number> {
	const collection = await getCollection(collectionAddress);

	if (collection) {
		return parseInt(collection.itemCount.toString());
	}
	return 0;
}

export async function getCollectionPalette(collectionAddress: string): Promise<string> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT palette FROM collections WHERE tokenAddress = ?', [collectionAddress], { as: 'object' });

	if (results.rows.length > 0) {
		const row: Record<string, any> = results.rows[0];
		return row.palette;
	}

	return '';
}

export async function getCollectionItemImageBytes(collectionAddress: string, tokenId: string): Promise<string> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT imageBytes FROM collection_items WHERE tokenAddress = ? AND tokenId = ?', [collectionAddress, tokenId], { as: 'object' });

	if (results.rows.length > 0) {
		const row: Record<string, any> = results.rows[0];
		return row.imageBytes;
	}

	return '';
}

export async function getCollectionItemMetaGenerated(collectionAddress: string, tokenId: string): Promise<string> {
  	const conn = connect(configIndexer);
	const results = await conn.execute('SELECT metaGenerated FROM collection_items WHERE tokenAddress = ? AND tokenId = ?', [collectionAddress, tokenId], { as: 'object' });

	if (results.rows.length > 0) {
		const row: Record<string, any> = results.rows[0];
		return row.metaGenerated;
	}

	return '';
}

/*
 * Indexer save functions
 */

export async function indexComposableItemCollections(): Promise<boolean> {
  	const conn = connect(configIndexer);
	
	const collectionCreatedEvents = await contracts.getCollectionCreatedEvents();

	const results = await conn.execute('SELECT collectionContract FROM events_collection_created');
	const rows: Record<string, any>[] = results.rows.map(row => ({...row}) as Record<string, any> );
	const collections: string[] = rows.map(row => (row.collectionContract) as string );	

	for (let i = 0; i < collectionCreatedEvents.length; i++) {
		const event = collectionCreatedEvents[i];

		if (collections.indexOf(event.collectionContract) === -1) {
			const insert = await conn.execute('INSERT INTO events_collection_created (blockNumber, blockHash, collectionContract, creator, version, name, symbol, nonce) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [event.blockNumber, event.blockHash, event.collectionContract, event.creator, event.version, event.name, event.symbol, event.nonce]);
			const insert2 = await conn.execute('INSERT INTO collections (tokenAddress, owner, name, symbol) VALUES (?, ?, ?, ?)', [event.collectionContract, event.creator, event.name, event.symbol]);
			//rows affected
			console.log('index collection', insert, insert2);
		}
	}
  	
	return true;
}

export async function indexComposableItems(tokenAddress: string): Promise<boolean> {
  	const conn = connect(configIndexer);
  	
  	const indexCount = await getCollectionItemCount(tokenAddress);
  	const contractCount = await contracts.getCollectionItemCount(tokenAddress);

	const results = await conn.execute('SELECT tokenAddress, tokenId FROM collection_items');
	const rows: Record<string, any>[] = results.rows.map(row => ({...row}) as Record<string, any> );
  	
  	if (indexCount < contractCount) {
	  	const paletteRaw = await contracts.getCollectionPalette(tokenAddress);
					
		for (let i = indexCount; i < contractCount; i++) {
			
			if (!rows.find(item => (item.tokenAddress === tokenAddress && item.tokenId === i))) {

				const data = await contracts.getCollectionItemImageBytes(tokenAddress, i.toString());		
				const meta = await contracts.getCollectionItemMetaGenerated(tokenAddress, i.toString());
				
				if (data && meta) {
					const insert = await conn.execute('INSERT INTO collection_items (tokenAddress, tokenId, imageBytes, metaGenerated) VALUES (?, ?, ?, ?)', [tokenAddress, i, data, meta]);
					console.log('index collection item', insert);
				}
				
			}
		}		
	  	
		const update = await conn.execute('UPDATE collections SET itemCount = ?, palette = ? WHERE tokenAddress = ?', [contractCount, paletteRaw, tokenAddress]);
	  	console.log('index collection items', update);  		
  	}
  	

	return true;	
}

export async function indexComposablesMarketListings(): Promise<boolean> {
  	const conn = connect(configIndexer);
	
	const listingsCreated = await contracts.getListingCreatedEvents();
	const listingsDeleted = await contracts.getListingDeletedEvents();	

	const resultsCreated = await conn.execute('SELECT listingId FROM events_listing_created');
	const rowsCreated: Record<string, any>[] = resultsCreated.rows.map(row => ({...row}) as Record<string, any> );
	const listingIdsCreated: number[] = rowsCreated.map(row => (row.listingId) as number );	

	for (let i = 0; i < listingsCreated.length; i++) {
		const event = listingsCreated[i];

		if (listingIdsCreated.indexOf(parseInt(event.listingId.toString())) === -1) {
			const insert = await conn.execute('INSERT INTO events_listing_created (blockNumber, blockHash, listingId, seller, tokenAddress, tokenId, price, quantity, maxPerAddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [event.blockNumber, event.blockHash, event.listingId, event.seller, event.tokenAddress, event.tokenId, event.price, event.quantity, event.maxPerAddress]);
			//rows affected
			console.log('index listing created', insert);
		}
	}

	const resultsDeleted = await conn.execute('SELECT listingId FROM events_listing_deleted');
	const rowsDeleted: Record<string, any>[] = resultsDeleted.rows.map(row => ({...row}) as Record<string, any> );
	const listingIdsDeleted: number[] = rowsDeleted.map(row => (row.listingId) as number );	

	for (let i = 0; i < listingsDeleted.length; i++) {
		const event = listingsDeleted[i];

		if (listingIdsDeleted.indexOf(parseInt(event.listingId.toString())) === -1) {
			const insert = await conn.execute('INSERT INTO events_listing_deleted (blockNumber, blockHash, listingId) VALUES (?, ?, ?)', [event.blockNumber, event.blockHash, event.listingId]);
			//rows affected
			console.log('index listing deleted', insert);
		}
	}
  	
	return true;
}


