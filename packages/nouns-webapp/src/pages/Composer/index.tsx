//import React from 'react';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import classes from './Composer.module.css';
import { Container, Row, Col, Button, Image, Form, OverlayTrigger, Popover, Spinner } from 'react-bootstrap';

import { ComposableItemCollection, getComposableItemCollections, 
	TokenItem, getTokenHoldings, filterComposableItem, filterTokenItem,
	ComposableEncodedImage, ComposableItem, getComposableItems } from '../../utils/composables/composablesWrapper';
//	ComposablesMarketListing, getComposablesMarketListings,
import BigNumber from 'bignumber.js';
	
import { useAppSelector } from '../../hooks';

import Noun from '../../components/Noun';
import { ImageData } from '@nouns/assets';
import { EncodedImage, PNGCollectionEncoder } from '@nouns/sdk';
import { buildSVG } from '../../utils/composables/nounsSDK';
import { getNounData, getRandomNounSeed } from '../../utils/composables/nounsAssets';

import { INounSeed } from '../../wrappers/nounToken';
import InfoIcon from '../../assets/icons/Info.svg';
import { PNG } from 'pngjs';
import NounModal from './NounModal';
import NounPicker from './NounPicker';
import SaveModal from './SaveModal';
import ComposerTour from './ComposerTour';

import config from '../../config';

import { Trans } from '@lingui/macro';

// @ts-ignore
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/* start drag and drop */

//TODO: Move DND to its own component/file
// a little function to help us with reordering the result
const reorder = (list: ComposableItem[], startIndex: any, endIndex: any) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const move = (source: ComposableItem[], destination: ComposableItem[], droppableSource: any, droppableDestination: any) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result: any = {};
    //result[droppableSource.droppableId] = sourceClone;
    //result[droppableDestination.droppableId] = destClone;
    result['source'] = sourceClone;
    result['destination'] = destClone;

    return result;
};

const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: 5,
  //margin: `0 ${grid}px 0 0`,
  //margin: `0 0 ${grid}px 0`,
  minWidth: '125px',
  fontSize: 'x-small',
  borderRadius: '16px',
	
  // change background colour if dragging
  background: isDragging ? 'lightblue' : '',

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver: boolean, styleJustify: string, styleOverflow: string) => ({
  background: isDraggingOver ? 'lightgreen' : '#f0f0f0',
//    padding: grid,
//    width: 250
  display: 'flex',
  padding: 8,
  overflow: styleOverflow,
  minHeight: '140px',
  maxHeight: '400px',
  justifyContent: styleJustify,
  borderRadius: '16px',
});

const DroppableControl: React.FC<{ droppableId: string; droppableItems: ComposableItem[]; itemLimit: number; holdings: TokenItem[] }> = props => {
  const { droppableId, droppableItems, itemLimit, holdings } = props;
  
  const styleJustify = (itemLimit === 1) ? 'center' : 'left';
  const styleOverflow = (itemLimit > 10) ? 'auto' : 'hidden';
  const direction = (itemLimit > 10) ? 'vertical' : 'horizontal';
  const baseClassName = (itemLimit > 10) ? classes.dropList : '';
  //const itemClassName = (filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId)) ? classes.nounImgDrag : classes.nounImgDragHighlight;
  const isDropDisabled = false;//(droppableItems.length === itemLimit) ? true : false;
    
  return (
    <Droppable droppableId={droppableId} direction={direction} isDropDisabled={isDropDisabled}>
        {(provided: any, snapshot: any) => (
            <div
                ref={provided.innerRef}
                className={baseClassName}
                style={getListStyle(snapshot.isDraggingOver, styleJustify, styleOverflow)}>
                {droppableItems.map((item, index) => (
                    <Draggable
                        key={item.tokenAddress + "-" + item.tokenId}
                        draggableId={item.tokenAddress + "-" + item.tokenId}
                        index={index}>
                        {(provided: any, snapshot: any) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                    snapshot.isDragging,
                                    provided.draggableProps.style
                                )}>
								<Noun
				                  imgPath={`data:image/svg+xml;base64,${btoa(getSVG(item.image.filename, item.image.data, item.image.palette))}`}
				                  alt="Item"
				                  className={(filterTokenItem(holdings, item.tokenAddress, item.tokenId)) ? classes.nounImgDragHighlight : classes.nounImgDrag}
				                  wrapperClassName={classes.nounWrapperDrag}
				                />		                                            
				                <p style={{textAlign: 'center', margin: 0, padding: 0}}>{shortName(item.meta.name)}</p>
                            </div>
                        )}
                    </Draggable>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
  );
};

const getSVG = (filename: string, data: string, palette: string[]): string => {
  const part = {
  	"filename": filename,
	"data": data,
  };
  const parts = [ part ];
  const svg = buildSVG(parts, palette, 'fff');
  return svg;
};

interface ComposableItemGroup {
  id: string;
  items: ComposableItem[];
}

/* end drag and drop */


const shortName = (name: string) => {
  if (name.length < 21) {
    return name;
  }
  return [name.substr(0, 7), name.substr(name.length - 11, 11)].join('...');
};

interface PendingCustomTrait {
  type: string;
  data: string;
  palette: string[];
  filename: string;
}

const DEFAULT_TRAIT_TYPE = 'heads';

const ComposerPage = () => {

  const [stateItemsArray, setStateItemsArray] = useState<ComposableItemGroup[]>([]);
  const [nounExtensions, setNounExtensions] = useState<any[]>([]);
  const [nounExtensionName, setNounExtensionName] = useState<string>('Nouns');    
  const [nounTokenAddress, setNounTokenAddress] = useState<string>();
  const [nounTokenId, setNounTokenId] = useState<number>();
  const [composerProxyAddress, setComposerProxyAddress] = useState<string>();
  const [previousChildTokens, setPreviousChildTokens] = useState<TokenItem[]>([]);
  const [previousComposedChildTokens, setPreviousComposedChildTokens] = useState<TokenItem[]>([]);
    
  const [composedItems, setComposedItems] = useState<ComposableItem[]>([]);
  const [hasOwnedComposedItems, setHasOwnedComposedItems] = useState<boolean>(true);
  const [hasDifferentComposedItems, setHasDifferentComposedItems] = useState<boolean>(true);

  const [seed, setSeed] = useState<INounSeed>();
  const [nounSVG, setNounSVG] = useState<string>();    
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [displayNounModal, setDisplayNounModal] = useState<boolean>(false);
  const [displayNounPicker, setDisplayNounPicker] = useState<boolean>(false);
  const [displaySaveModal, setDisplaySaveModal] = useState<boolean>(false);

  const [pendingTrait, setPendingTrait] = useState<PendingCustomTrait>();
  const [isPendingTraitValid, setPendingTraitValid] = useState<boolean>();

  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  //const [listings, setListings] = useState<ComposablesMarketListing[]>();
  const [holdings, setHoldings] = useState<TokenItem[]>([]);  
  
  const [selectedOwned, setSelectedOwned] = useState<boolean>(true);
    
  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const customTraitFileRef = useRef<HTMLInputElement>(null);
  
  const getImageData = (name: string) => {
	  for (const extension of nounExtensions) {
	  	if (extension.name === name) {
	  		return extension.imageData;	  		
	  	}
	  }	  
	  return ImageData;	    
  }

  const generateRandomSeed = () => {
  	const randomIndex = Math.floor(Math.random() * nounExtensions.length);
  	const randomExtension = nounExtensions[randomIndex];
  	
  	const seed = getRandomNounSeed(getImageData(randomExtension.name));

	setNounTokenAddress(undefined);
	setNounTokenId(undefined);
  	setNounExtensionName(randomExtension.name);
	setSeed(seed);
	setPreviousChildTokens([]);
	setPreviousComposedChildTokens([]);
  };

  useEffect(() => {
    const loadCollections = async () => {

	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	setCollections([]);
	  } else {
		setCollections(collections);
	  }
    };

    const loadExtensions = async () => {

	  const extensions = config.composables.extensions;		  
	  for (const extension of extensions) {
		    const response = await fetch(extension.imageDataUri);
		    const data = await response.json();			    
		    extension.imageData = data;
	  }		  
	  
	  setNounExtensions(extensions);
    };
    
    if (initLoad) {

		loadCollections();
		
	    setNounExtensions(config.composables.extensions);
	    loadExtensions();
    	
	    setStateItemsArray((stateItemsArray) => [
	        ...stateItemsArray,
	        { id: "Foreground", items: [] },
	        { id: "Glasses", items: [] },
	        { id: "Head", items: [] },
	        { id: "Accessory", items: [] },
	        { id: "Body", items: [] },
	        { id: "Background", items: [] },
	    ]);	   		    

      setInitLoad(false);
    }
  }, [initLoad]);

  useEffect(() => {

    if (collections) {

	    const loadCollectionItems = async () => {
	    	
	    	const collectionNames: string[] = [];
	    	const creatorNames: string[] = [];
			const categoryNames: string[] = [];
			    
			//all of the items from the collections
			let items: ComposableItem[] = [];
	    	
	    	for (let i = 0; i < collections.length; i++) {
	    		const cItems = await getComposableItems(collections[i].tokenAddress, collections[i].itemCount, collections[i].name);
	    		
	    		items = items.concat(cItems);
	    	}
	    	
	    	for (let i = 0; i < items.length; i++) {
				
				const item = items[i];

			    if (collectionNames.indexOf(item.collection) === -1) {
			        collectionNames.push(item.collection)
			    }
				
			    if (creatorNames.indexOf(item.meta.attributes[1].value) === -1) {
			        creatorNames.push(item.meta.attributes[1].value)
			    }

			    if (categoryNames.indexOf(item.meta.attributes[0].value) === -1) {
			        categoryNames.push(item.meta.attributes[0].value)
			    }	    		
	    	}

			setCollectionItems(items);

		    setStateItemsArray((stateItemsArray) => [
		        ...stateItemsArray,
		        {
		            id: "Items",
		            items: items
		        },
		    ]);
	    };
	    
	    loadCollectionItems();
    }    

  }, [collections]);

  useEffect(() => {

    if (activeAccount && collections) {
	    
	    const loadHoldings = async () => {
			let items: TokenItem[] = [];
	    	
	    	for (let i = 0; i < collections.length; i++) {
	      		const cItems = await getTokenHoldings(collections[i].tokenAddress, activeAccount);

	    		items = items.concat(cItems);
	    	}
	    	
			setHoldings(items);	    	
	    };
	    
	    loadHoldings();
    }
  }, [activeAccount, collections]);


  useEffect(() => {
  	if (!seed) {
  		return;
  	}
  	const imageData = getImageData(nounExtensionName);
  	const { parts, background } = getNounData(seed, imageData);
  	  		
	const itemsBackground = getList('Background');
	const itemsBody = getList('Body');
	const itemsAccessory = getList('Accessory');
	const itemsHead = getList('Head');
	const itemsGlasses = getList('Glasses');
	const itemsForeground = getList('Foreground');
	
  	const partsComposed: any[] = [];

	partsComposed[0] = itemsBackground[0];
	partsComposed[1] = itemsBackground[1];
	partsComposed[2] = itemsBackground[2];
	partsComposed[3] = itemsBackground[3];

	partsComposed[4] = (itemsBody[0]) ? itemsBody[0] : parts[0];
	partsComposed[6] = (itemsAccessory[0]) ? itemsAccessory[0] : parts[1];
	partsComposed[8] = (itemsHead[0]) ? itemsHead[0] : parts[2];
	partsComposed[10] = (itemsGlasses[0]) ? itemsGlasses[0] : parts[3];

	partsComposed[12] = itemsForeground[0];
	partsComposed[13] = itemsForeground[1];
	partsComposed[14] = itemsForeground[2];
	partsComposed[15] = itemsForeground[3];
	
	//const collections: ComposableItemCollection[] = collectionsCreated.map(item => ({tokenAddress: item.collectionContract, owner: item.creator, name: item.name, symbol: item.symbol, itemCount: -1}) as ComposableItemCollection );
	
	const svg = buildSVG(partsComposed.filter(part => part != null).map(item => ((item.image) ? item.image : item)), imageData.palette, background);
	setNounSVG(svg);
	
	const mergedHoldings = holdings.concat(previousChildTokens);
	const countUnownedMatches = partsComposed
		.filter(part => part != null)
		.filter(item => item.image)
		.filter(item => !filterTokenItem(mergedHoldings, item.tokenAddress, item.tokenId));
	
	setComposedItems(partsComposed);
	setHasOwnedComposedItems(countUnownedMatches.length === 0);
	
	let differentComposedItems = false;
	if (previousComposedChildTokens) {
		for (let i = 0; i < previousComposedChildTokens.length; i++) {
			const part = (partsComposed[i] != null) ? (partsComposed[i].image ? partsComposed[i] : null) : null;
			const child: TokenItem = previousComposedChildTokens[i];

			if (child) {
				if (child.tokenAddress !== '0x0000000000000000000000000000000000000000' || part != null) {
					
					if (child.tokenAddress === '0x0000000000000000000000000000000000000000' || part === null) {
						differentComposedItems = true;
					} else if (child.tokenAddress !== part.tokenAddress || !child.tokenId.isEqualTo(part.tokenId)) {
						differentComposedItems = true;
					}
				}
			}
		}		
	}
	setHasDifferentComposedItems(differentComposedItems);
	
	
  	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, stateItemsArray]);
  
    
  const resetListsWithComposedChildTokens = (composedChildTokens: TokenItem[]) => {
  	
	const itemsBackground: ComposableItem[] = [];
	const itemsBody: ComposableItem[] = [];
	const itemsAccessory: ComposableItem[] = [];
	const itemsHead: ComposableItem[] = [];
	const itemsGlasses: ComposableItem[] = [];
	const itemsForeground: ComposableItem[] = [];
	
	for (let i = 0; i < composedChildTokens.length; i++) {
		const child: TokenItem = composedChildTokens[i];
		
		if (child.tokenAddress !== '0x0000000000000000000000000000000000000000') {
			const match = filterComposableItem(collectionItems!, child.tokenAddress, child.tokenId);
			
			if (match) {
				if (i < 4) {
					itemsBackground.push(match);
				} else if (i < 6) {
					itemsBody.push(match);
				} else if (i < 8) {
					itemsAccessory.push(match);
				} else if (i < 10) {
					itemsHead.push(match);
				} else if (i < 12) {
					itemsGlasses.push(match);
				} else {					
					itemsForeground.push(match);
				}
			}
		}
	}
	
	const filteredComposedChildTokens = composedChildTokens.filter(child => child.tokenAddress !== '0x0000000000000000000000000000000000000000');
	const filteredCollectionItems = collectionItems!.filter(item => !filterTokenItem(filteredComposedChildTokens, item.tokenAddress, item.tokenId));

  	const resetStateItemsArray: ComposableItemGroup[] = [
        { id: "Foreground", items: itemsForeground },
        { id: "Glasses", items: itemsGlasses },
        { id: "Head", items: itemsHead },
        { id: "Accessory", items: itemsAccessory },
        { id: "Body", items: itemsBody },
        { id: "Background", items: itemsBackground },  	
        { id: "Items", items: filteredCollectionItems },
  	];

	setStateItemsArray(resetStateItemsArray);
  }

  const getList = (listId: string) => {
  	var items: ComposableItem[] = [];
  	
	stateItemsArray.forEach(droppableItem => {
	    if (droppableItem.id === listId) {
	    	items = droppableItem.items;
	    }
	});
	  
	if (listId === 'Items' && selectedOwned === true) {
		items = items.filter(encodedItem => filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId));
	}
  	
  	return items;
  }
    
  const onDragEnd = (results: any) => {  		
        const { source, destination } = results;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                getList(source.droppableId),
                source.index,
                destination.index
            );
            
			setStateItemsArray(
	            stateItemsArray.map((droppables) =>
	                droppables.id === source.droppableId
	                    ? { ...droppables, items: items }
	                    : { ...droppables }
	            )
	        );
        } else {
        	
        	const sourceList = getList(source.droppableId);
        	const destinationList = getList(destination.droppableId);
        	
        	//TODO: clean this up, make it configurable via params
        	var itemLimit = 1000;
        	if (destination.droppableId === "Background" || destination.droppableId === "Foreground") {
        		itemLimit = 4;
        	}
        	if (destination.droppableId === "Body" || destination.droppableId === "Accessory" 
        		|| destination.droppableId === "Head" || destination.droppableId === "Glasses") {
        		itemLimit = 1;
        	}

  			const replace = (destinationList.length === itemLimit);
        	
        	var replacedItem = undefined;
        	if (replace) {
        		//remove an item from the array
        		if (destination.index === itemLimit) {
        			replacedItem = destinationList.shift();
        		} else {
        			replacedItem = destinationList.pop();		
        		}
        		        		
        		//also subtract one from destination index
        		if (destination.index > 0) {
					//destination.index--;
        		}
        	}
        	
            const result = move(
                sourceList,
                destinationList,
                source,
                destination
            );
			
            var tempItems = stateItemsArray.map((droppables) =>
                droppables.id === source.droppableId
                    ? { ...droppables, items: result.source }
                    : { ...droppables }
           	);
           	
           	if (replace && replacedItem !== undefined) {           		
           		const droppableId = 'Items';
		      	const items = (source.droppableId === droppableId) ? result.source : getList(droppableId);
      			items.unshift(replacedItem);
           		
           		tempItems = tempItems.map((droppables) =>
	                droppables.id === droppableId
	                    ? { ...droppables, items: items }
	                    : { ...droppables }
	           );
           	}

			setStateItemsArray(
	            tempItems.map((droppables) =>
	                droppables.id === destination.droppableId
	                    ? { ...droppables, items: result.destination }
	                    : { ...droppables }
	            )
	        );			
        }
    };  

  const resetTraitFileUpload = () => {
    if (customTraitFileRef.current) {
      customTraitFileRef.current.value = '';
    }
  };

  let pendingTraitErrorTimeout: NodeJS.Timeout;
  const setPendingTraitInvalid = () => {
    setPendingTraitValid(false);
    resetTraitFileUpload();
    pendingTraitErrorTimeout = setTimeout(() => {
      setPendingTraitValid(undefined);
    }, 5_000);
  };

  const validateAndSetCustomTrait = (file: File | undefined) => {
    if (pendingTraitErrorTimeout) {
      clearTimeout(pendingTraitErrorTimeout);
    }
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = Buffer.from(e?.target?.result!);
        const png = PNG.sync.read(buffer);
        if (png.width !== 32 || png.height !== 32) {
          throw new Error('Image must be 32x32');
        }
        const filename = file.name?.replace('.png', '') || 'custom';
        const encoder = new PNGCollectionEncoder([]); //empty palette
        const data = encoder.encodeImage(filename, {
          width: png.width,
          height: png.height,
          rgbaAt: (x: number, y: number) => {
            const idx = (png.width * y + x) << 2;
            const [r, g, b, a] = [
              png.data[idx],
              png.data[idx + 1],
              png.data[idx + 2],
              png.data[idx + 3],
            ];
            return {
              r,
              g,
              b,
              a,
            };
          },
        });
        setPendingTrait({
          data,
          palette: encoder.data.palette,
          filename,
          type: DEFAULT_TRAIT_TYPE,
        });
        setPendingTraitValid(true);
      } catch (error) {
        setPendingTraitInvalid();
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const uploadCustomTrait = () => {
    const { type, data, palette, filename } = pendingTrait || {};
    if (type && data && palette && filename) {
      const imageData = getImageData(nounExtensionName);
      const images = imageData.images as Record<string, EncodedImage[]>;
      images[type].push({
        filename,
        data,
      });
      
      const droppableId = 'Items';
      const items = getList(droppableId);
      
      const image: ComposableEncodedImage = {filename: filename, data: data, palette: palette};
      const meta = JSON.parse("{}");
      meta.name = filename;
	  const item: ComposableItem = { meta: meta, image: image, collection: 'None', tokenAddress: filename, tokenId: new BigNumber(0) };
      items.unshift(item);


	  setStateItemsArray(
        stateItemsArray.map((droppables) =>
            droppables.id === droppableId
                ? { ...droppables, items: items }
                : { ...droppables }
        )
      );

      /*
      const title = traitKeyToTitle[type];
      const trait = traits?.find(t => t.title === title);
      */

      resetTraitFileUpload();
      setPendingTrait(undefined);
      setPendingTraitValid(undefined);
      /*
      traitButtonHandler(trait!, 0);
      setSelectIndexes({
        ...selectIndexes,
        [title]: 0,
      });
      */
    }
  };

  const handleOwnedFilterChange = () => {
    setSelectedOwned(current => !current);
  };
  
  var encodedItems: ComposableItem[] = getList('Items');
  
  if (true) {
	  if (selectedOwned === true) {
	  	//encodedItems = encodedItems.filter(encodedItem => filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId));
	  }
  }
  
  const mergedHoldings = holdings.concat(previousChildTokens);
  
  const saveEnabled = (nounTokenAddress !== undefined && nounTokenId !== undefined && composerProxyAddress !== undefined) && (hasOwnedComposedItems) && (hasDifferentComposedItems);

  return (
    <>
      {displayNounModal && nounSVG && (
        <NounModal
          onDismiss={() => {
            setDisplayNounModal(false);
          }}
          svg={nounSVG}
        />
      )}
      {displayNounPicker && (
        <NounPicker
          onSelect={(extensionName: string | undefined, tokenAddress: string | undefined, tokenId: number | undefined, seed: INounSeed | undefined, composerProxyAddress: string | undefined, childTokens: TokenItem[], composedChildTokens: TokenItem[]) => {
          	//check if none selected, then just close modal

          	if (tokenAddress !== undefined && tokenId !== undefined
          		&& extensionName !== undefined && seed !== undefined) {
	          	setNounExtensionName(extensionName);
	          	setSeed(seed);

				setNounTokenAddress(tokenAddress);
				setNounTokenId(tokenId);
				
				setComposerProxyAddress(composerProxyAddress);
				setPreviousChildTokens(childTokens);
				setPreviousComposedChildTokens(composedChildTokens);

				resetListsWithComposedChildTokens(composedChildTokens);
	        }
          	
            setDisplayNounPicker(false);
          }}
        />
      )}  	
      {displaySaveModal && composerProxyAddress && (
        <SaveModal
          tokenAddress={nounTokenAddress!}
          tokenId={nounTokenId!}
          composedItems={composedItems}
          composerProxyAddress={composerProxyAddress}
          collectionItems={collectionItems!}
          previousChildTokens={previousChildTokens}
          previousComposedChildTokens={previousComposedChildTokens}
          svg={nounSVG!}
          onComplete={(saved: boolean) => {          	
          	//check if none selected, then just close modal
          	
            setDisplaySaveModal(false);
          	
          	if (saved) {
          		//do a refresh
          	}
          }}
        />
      )}  	

      <Container fluid="lg">
        <Row>
          <Col lg={12} className={classes.headerRow}>
            <span>
              <Trans>Pre-Alpha</Trans>
            </span>
            <h1>
              <Trans>Composer</Trans>
            </h1>
            <p>
            	Composables allow for the Nouns community to expand their digital identity in new and creative ways.

            	More than just a Playground, you can now personalize your Noun on-chain and make it your own.
                Add unique visual layers to enhance your avatar, 
                update the metadata for games and other platforms, 
                and a whole lot more.
            </p>
            <p>
                To start, please select a Noun from your wallet, or generate a random Noun:
            </p>
          </Col>
          <Col lg={6}>
            <Button onClick={() => setDisplayNounPicker(true)} className={classes.primaryBtnSelecter}>
              Select Noun
            </Button>			
			&nbsp;&nbsp;&nbsp;
            <Button onClick={() => generateRandomSeed()} className={classes.primaryBtnSelecter}>
              Random Noun
            </Button>			
        			
          </Col>
        </Row>
    	{collectionItems === undefined && (
			<div className={classes.spinner}>
				<Spinner animation="border" />
			</div>
		)}		        
        
		<Row className="composer-selecter">
		<DragDropContext onDragEnd={(results: any) => {onDragEnd(results);}}>
        {nounSVG && (
        	<>
		      <Col lg={6} xs={12}>
				{nounSVG && (
		          <div
		            onClick={() => {
		              setDisplayNounModal(true);
		            }}
		          >
					<Noun
		              imgPath={`data:image/svg+xml;base64,${btoa(nounSVG)}`}
		              alt="Noun"
		              className={classes.nounImg}
		              wrapperClassName={classes.nounWrapper}
		            />	
		          </div>
				)}
			  </Col>
		      <Col lg={6} xs={12}>
		
					<Row style={{marginBottom: 25}}>
						<Col lg={12} xs={12}>
							<strong>Foreground</strong>
							<DroppableControl droppableId="Foreground" droppableItems={getList('Foreground')} holdings={mergedHoldings} itemLimit={4} />
						</Col>
					</Row>
					<Row style={{marginBottom: 25}}>
						<Col lg={3} xs={3}>
							<strong>Body</strong>
							<DroppableControl droppableId="Body" droppableItems={getList('Body')} holdings={mergedHoldings} itemLimit={1} />
						</Col>
						<Col lg={3} xs={3}>
							<strong>Accessory</strong>
							<DroppableControl droppableId="Accessory" droppableItems={getList('Accessory')} holdings={mergedHoldings} itemLimit={1} />
						</Col>
						<Col lg={3} xs={3}>
							<strong>Head</strong>
							<DroppableControl droppableId="Head" droppableItems={getList('Head')} holdings={mergedHoldings} itemLimit={1} />
						</Col>
						<Col lg={3} xs={3}>
							<strong>Glasses</strong>
							<DroppableControl droppableId="Glasses" droppableItems={getList('Glasses')} holdings={mergedHoldings} itemLimit={1} />
						</Col>
					</Row>
					<Row>
						<Col lg={12} xs={12}>
							<strong>Background</strong>
							<DroppableControl droppableId="Background" droppableItems={getList('Background')} holdings={mergedHoldings} itemLimit={4} />
						</Col>
					</Row>
			  </Col>
        	</>
		)}
        {(activeAccount || nounSVG) && (
        	<>
        	<Col lg={1}>
	    		<strong>Items</strong>
	    	</Col>
      		<Col lg={11}>
      			<Form.Check type="switch" id="custom-switch" 
      			defaultChecked={selectedOwned}
      			value={selectedOwned.toString()}
		        onChange={handleOwnedFilterChange}
      			label="Only show owned items" />
      		</Col>

	  	  	<Col lg={12}>	    	
				<DroppableControl droppableId="Items" droppableItems={encodedItems} holdings={mergedHoldings} itemLimit={1000} />          					
	  	  	</Col>		
        	</>
		)}
		</DragDropContext>
		</Row>
		<Row className="composer-saver">
        {nounSVG && (
        	<Row>
        		<Col lg={12}>
		            <Button className={classes.primaryBtnSaver} onClick={() => setDisplayNounModal(true)}>
		              Download
		            </Button>			
					&nbsp;&nbsp;&nbsp;
		            <Button className={classes.primaryBtnSaver} onClick={() => setDisplaySaveModal(true)} disabled={!saveEnabled}>
		              Save On-Chain
		            </Button>			
        		
	         	</Col>
	        </Row>
		)}
		</Row>		
		<Row className="composer-uploader">
        {nounSVG && (
        	<Row>
	          	  <Col lg={12}>					
					<hr style={{ marginBottom: 0 }} />
	          	  </Col>
	
	          	  <Col lg={3}>
	
		            <label style={{ margin: '1rem 0 .25rem 0' }} htmlFor="custom-trait-upload">
		              <Trans>Upload Custom Trait</Trans>
		              <OverlayTrigger
		                trigger={["hover", "hover"]}
		                placement="top"
		                overlay={
		                  <Popover>
		                    <div style={{ padding: '0.25rem' }}>
		                      <Trans>Only 32x32 PNG images are accepted</Trans>
		                    </div>
		                  </Popover>
		                }
		              >
		                <Image
		                  style={{ margin: '0 0 .25rem .25rem' }}
		                  src={InfoIcon}
		                  className={classes.voteIcon}
		                />
		              </OverlayTrigger>
		            </label>
		            <Form.Control
		              type="file"
		              id="custom-trait-upload"
		              accept="image/PNG"
		              isValid={isPendingTraitValid}
		              isInvalid={isPendingTraitValid === false}
		              ref={customTraitFileRef}
		              className={classes.fileUpload}
		              onChange={(e: ChangeEvent<HTMLInputElement>) =>
		                validateAndSetCustomTrait(e.target.files?.[0])
		              }
		            />
		            {pendingTrait && (
		              <>
		              	<br />
		                <Button onClick={() => uploadCustomTrait()} className={classes.primaryBtnUploader}>
		                  <Trans>Upload</Trans>
		                </Button>
		              </>
		            )}
	
	          	  </Col>
	          	  <Col lg={9}>

		            <p style={{ fontStyle: 'italic' }}>
		                Are you a Noundry artist or an extension creator? We'd love to add your creations to the Composables marketplace!
		            </p>

				  </Col>
	          	  
	        	</Row>
		)}		
		</Row>
      </Container>
      {nounSVG && (
        <ComposerTour
          svg={nounSVG}
        />
      )}      
    </>
  );
};

export default ComposerPage;
