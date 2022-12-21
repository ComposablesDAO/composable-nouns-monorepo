//import React from 'react';
import React, { ChangeEvent, useEffect, useRef, useState, ReactNode } from 'react';
import classes from './Composer.module.css';
import { Container, Row, Col, Button, Form, Spinner, ListGroup } from 'react-bootstrap';
import TooltipInfo from '../../components/TooltipInfo';

import { ComposableItemCollection, getComposableItemCollections, 
	TokenItem, getTokenHoldings, filterComposableItem, filterTokenItem,
	ComposableEncodedImage, ComposableItem, getComposableItemsBatch } from '../../utils/composables/composablesWrapper';
//	ComposablesMarketListing, getComposablesMarketListings,
import BigNumber from 'bignumber.js';
	
import { useAppSelector } from '../../hooks';

import Noun from '../../components/Noun';
import { ImageData } from '@nouns/assets';
import { EncodedImage, PNGCollectionEncoder } from '@nouns/sdk';
import { buildSVG } from '../../utils/composables/nounsSDK';
import { getNounData, getRandomNounSeed } from '../../utils/composables/nounsAssets';

import { INounSeed } from '../../wrappers/nounToken';
import { PNG } from 'pngjs';
import NounModal from './NounModal';
import NounPicker from './NounPicker';
import SaveModal from './SaveModal';
import ComposerTour from './ComposerTour';

import config from '../../config';

import { Trans } from '@lingui/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

// @ts-ignore
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/* start drag and drop */
const iconGlasses = (
	<svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path fill="currentColor" d="M13,11L13,9L7,9L7,11L4,11L4,14L5,14L5,12L7,12L7,15L13,15L13,12L14,12L14,15L20,15L20,9L14,9L14,11L13,11ZM15,10L15,14L17,14L17,10L15,10ZM8,10L8,14L10,14L10,10L8,10Z"></path>
	</svg>	
)

const iconHead = (
	<svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path fill="currentColor" d="M20,19L20,4L4,4L4,11L6,11L6,9L12,9L12,11L13,11L13,9L19,9L19,15L13,15L13,12L12,12L12,15L6,15L6,12L4,12L4,19L20,19ZM18,14L16,14L16,10L18,10L18,14ZM11,14L9,14L9,10L11,10L11,14Z"></path>
	</svg>	
)

const iconAccessory = (
	<svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path fill="currentColor" d="M10,18L10,20L8,20L8,16L12,16L12,18L10,18ZM12,20L12,18L14,18L14,16L16,16L16,20L12,20ZM12,14L12,10L14,10L14,12L16,12L16,10L18,10L18,14L12,14ZM6,14L6,10L10,10L10,14L6,14ZM12,6L10,6L10,8L8,8L8,4L12,4L12,6ZM16,8L12,8L12,6L14,6L14,4L16,4L16,8Z"></path>
	</svg>	
)

const iconBody = (
	<svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path fill="currentColor" d="M8,18L8,11L7,11L7,18L5,18L5,7L19,7L19,18L8,18Z"></path>
	</svg>	
)

const iconLayer = (
	<svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path fill="currentColor" d="M17,6L20,6L20,19L7,19L7,17L4,17L4,4L17,4L17,6ZM8,7L8,18L19,18L19,7L8,7Z"></path>
	</svg>	
)


const grid = 8;
const getItemStyle = (isDragging: boolean, draggableStyle: any, isEmpty?: boolean) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  padding: isEmpty ? 1 : 1,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? "lightgreen" : "lightgrey",
  fontSize: 'small',

  // styles we need to apply on draggables
  ...draggableStyle
});

const getListStyle = (isDraggingOver: boolean, styleJustify: string, styleOverflow: string) => ({
  background: isDraggingOver ? "lightblue" : "#f0f0f0",
  padding: grid,
  width: '100%',
  borderRadius: '16px',
});

//TODO: Move DND to its own component/file
// a little function to help us with reordering the result
const reorder = (list: ComposableItem[], startIndex: any, endIndex: any) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyleOld = (isDragging: boolean, draggableStyle: any) => ({
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

const getListStyleOld = (isDraggingOver: boolean, styleJustify: string, styleOverflow: string) => ({
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

const isSpecialLayer = (index: number): boolean => (ri(index) === 4 || ri(index) === 6 || ri(index) === 8 || ri(index) === 10);
const ri = (index: number): number => 15 - index;

/*
const layerName = (index: number): string => {
	const layerMap = new Map([
  		[4, 'Body'],
	    [6, 'Accessory'],
	    [8, 'Head'],
	    [10, 'Glasses'],
	]);
	
	const layer = layerMap.get(ri(index));
	return (layer!== undefined) ? layer : index.toString();
};
*/

const layerIcon = (index: number): ReactNode => {
  	const layerMap = new Map([
  		[4, iconBody],
	    [6, iconAccessory],
	    [8, iconHead],
	    [10, iconGlasses],
	]);
	
	const layer = layerMap.get(ri(index));
	return (layer!== undefined) ? layer : iconLayer;
};


const DraggableControl: React.FC<{ item: ComposableItem; index: number; holdings: TokenItem[]; palette?: string[]; onRemoveItemClick: (index: number) => void;}> = props => {
  const { item, index, holdings, palette, onRemoveItemClick } = props;
  
  //const styleJustify = (itemLimit === 1) ? 'center' : 'left';
  //const styleOverflow = (itemLimit > 10) ? 'auto' : 'hidden';
  //const direction = (itemLimit > 10) ? 'vertical' : 'horizontal';
  //const baseClassName = (itemLimit > 10) ? classes.dropList : '';
  //const itemClassName = (filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId)) ? classes.nounImgDragNew : classes.nounImgDragHighlightNew;
  //const isDropDisabled = false;//(droppableItems.length === itemLimit) ? true : false;
  
  const hasItem = (item && item.meta && item.meta.name) || (isSpecialLayer(index));
  
  const temp: any = (item && !item.meta && isSpecialLayer(index)) ? item : null;
    
  return (
        <Draggable 
		key={index.toString()}
        draggableId={index.toString()}
        index={index}
        isDragDisabled={!(item && item.meta && item.meta.name)}
        >
          {(provided: any, snapshot: any) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={getItemStyle(
                snapshot.isDragging,
                provided.draggableProps.style,
                !hasItem
              )}
            >
    			{item && item.meta && item.meta.name && (
    				<ListGroup.Item>
				        <Row>
				          <Col lg={1} style={{color: 'lightgray', marginTop: '1rem'}} className={classes.droppableItemIcon}>
	    					{layerIcon(index)}
    					  </Col>
				          <Col lg={3} >
							<Noun
			                  imgPath={`data:image/svg+xml;base64,${btoa(getSVG(item.image.filename, item.image.data, item.image.palette))}`}
			                  alt="Item"
			                  className={(filterTokenItem(holdings, item.tokenAddress, item.tokenId)) ? classes.nounImgDragHighlightNew : classes.nounImgDragNew}
			                  wrapperClassName={classes.nounWrapperDragNew}
			                />
    					  </Col>
				          <Col lg={6} >
							<p style={{textAlign: 'left', margin: 0, padding: 0}}>{item.meta.name}</p>
    					  </Col>
				          <Col lg={2} style={{textAlign: 'right', marginTop: '1rem'}}>
						
	    					<Button onClick={() => onRemoveItemClick(index)} className={classes.primaryBtnSelecter} style={{width: 'initial'}}><FontAwesomeIcon icon={faTrash} /></Button>
	    					
    					  </Col>
				        </Row>
    				</ListGroup.Item>
    			)}
    			{temp && (
    				<ListGroup.Item>
				        <Row>
				          <Col lg={1} style={{color: 'lightgray', marginTop: '1rem'}}>
	    					{layerIcon(index)}
    					  </Col>
				          <Col lg={3} >
							<Noun
			                  imgPath={`data:image/svg+xml;base64,${btoa(getSVG(temp.filename, temp.data, palette!))}`}
			                  alt="Item"
			                  className={classes.nounImgDragNew}
			                  wrapperClassName={classes.nounWrapperDragNew}
			                />
    					  </Col>
				          <Col lg={6} >
				          	<p style={{textAlign: 'left', margin: 0, padding: 0}}>{temp.filename}</p>
    					  </Col>
				          <Col lg={2} >
				          	&nbsp;
    					  </Col>
				        </Row>
    				</ListGroup.Item>
    			)}

            </div>
          )}
        </Draggable>
  );
};

const DroppableControlNew: React.FC<{ droppableId: string; droppableItems: ComposableItem[]; itemLimit: number; holdings: TokenItem[]; palette?: string[]; onItemClick?: (item: ComposableItem) => void; onRemoveItemClick: (index: number) => void }> = props => {
  const { droppableItems, holdings, palette, onRemoveItemClick } = props;
  
  //const styleJustify = (itemLimit === 1) ? 'center' : 'left';
  //const styleOverflow = (itemLimit > 10) ? 'auto' : 'hidden';
  //const direction = (itemLimit > 10) ? 'vertical' : 'horizontal';
  //const baseClassName = (itemLimit > 10) ? classes.dropList : '';
  //const itemClassName = (filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId)) ? classes.nounImgDrag : classes.nounImgDragHighlight;
  //const isDropDisabled = false;//(droppableItems.length === itemLimit) ? true : false;
  const baseClassName = classes.dropListNew;

  return (
    <Droppable droppableId="droppable" isCombineEnabled={true}>
    
      {(provided: any, snapshot: any) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={baseClassName}
          style={getListStyle(snapshot.isDraggingOver, '', '')}
        >
          {droppableItems && droppableItems.slice().reverse().map((item, index) => (
            <DraggableControl item={item} index={index} holdings={holdings} palette={palette} onRemoveItemClick={onRemoveItemClick} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};      

const DroppableControl: React.FC<{ droppableId: string; droppableItems: ComposableItem[]; itemLimit: number; holdings: TokenItem[]; onItemClick?: (item: ComposableItem) => void; }> = props => {
  const { droppableId, droppableItems, itemLimit, holdings, onItemClick } = props;
  
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
                style={getListStyleOld(snapshot.isDraggingOver, styleJustify, styleOverflow)}>
                {droppableItems.map((item, index) => (
                    <Draggable
                        key={item.tokenAddress + "-" + item.tokenId}
                        draggableId={item.tokenAddress + "-" + item.tokenId}
                        index={index}
                        isDragDisabled={true}
                        >
                        {(provided: any, snapshot: any) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyleOld(
                                    snapshot.isDragging,
                                    provided.draggableProps.style
                                )}>
                                <div onClick={() => { if (onItemClick) onItemClick(item) }} >
								<Noun
				                  imgPath={`data:image/svg+xml;base64,${btoa(getSVG(item.image.filename, item.image.data, item.image.palette))}`}
				                  alt="Item"
				                  className={(filterTokenItem(holdings, item.tokenAddress, item.tokenId)) ? classes.nounImgDragHighlight : classes.nounImgDrag}
				                  wrapperClassName={classes.nounWrapperDrag}
				                />
				                </div>
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
    
  const [stateItems, setStateItems] = useState<ComposableItem[]>([]);
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

	const stateItems: ComposableItem[] = [];
	stateItems.length = 16;
	
	setStateItems(stateItems);


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
			const items = await getComposableItemsBatch(collections);
	    	
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
	    	
	    	const tempItems = items.slice();//0, 10
			setCollectionItems(tempItems);

		    setStateItemsArray((stateItemsArray) => [
		        ...stateItemsArray,
		        {
		            id: "Items",
		            items: tempItems
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


  const getTopComposedItemsIndex = () => {
  	
  	let index = 15;
	for (let i = composedItems.length - 1; i >= 0; i--) {
  		const item = composedItems[i];
  		if (item) {
  			index = i;
  			break;
  		}
	}

	if (index < 15) {
		index++;
	}
	
	return index;
  }
  
  const onItemClick = (item: ComposableItem) => {
  	
	const tempItems: ComposableItem[] = [...stateItems];

	const index = getTopComposedItemsIndex();
	tempItems[index] = item;

  	setStateItems(tempItems);
  }
  useEffect(() => {
  	if (!seed) {
  		return;
  	}
  	const imageData = getImageData(nounExtensionName);
  	const { parts, background } = getNounData(seed, imageData);

  	const partsComposed: any[] = [];

	partsComposed[0] = stateItems[0];
	partsComposed[1] = stateItems[1];
	partsComposed[2] = stateItems[2];
	partsComposed[3] = stateItems[3];

	partsComposed[4] = (stateItems[4]) ? stateItems[4] : parts[0];
	partsComposed[5] = stateItems[5];
	partsComposed[6] = (stateItems[6]) ? stateItems[6] : parts[1];
	partsComposed[7] = stateItems[7];
	partsComposed[8] = (stateItems[8]) ? stateItems[8] : parts[2];
	partsComposed[9] = stateItems[9];
	partsComposed[10] = (stateItems[10]) ? stateItems[10] : parts[3];
	partsComposed[11] = stateItems[11];

	partsComposed[12] = stateItems[12];
	partsComposed[13] = stateItems[13];
	partsComposed[14] = stateItems[14];
	partsComposed[15] = stateItems[15];
	
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
  }, [seed, stateItems, stateItemsArray]);
  
    
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
		const uploadedItems = items.filter(encodedItem => encodedItem.collection === 'UPLOADED');

		items = items.filter(encodedItem => filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId));
		
		items = items.concat(uploadedItems);
	}
  	
  	return items;
  }
       
  const onDragEnd = (results: any) => {  		
		//deleted
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
      //const items = getList(droppableId);
      //get it direct
      var items: ComposableItem[] = [];
      
      stateItemsArray.forEach(droppableItem => {
      	if (droppableItem.id === droppableId) {
			items = droppableItem.items;
		}
	  });
      
      const image: ComposableEncodedImage = {filename: filename, data: data, palette: palette};
      const meta = JSON.parse("{}");
      meta.name = filename;
	  const item: ComposableItem = { meta: meta, image: image, collection: 'UPLOADED', tokenAddress: filename, tokenId: new BigNumber(0) };
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
  //remove the items already in the composer layers
  encodedItems = encodedItems.filter(encodedItem => !filterTokenItem(composedItems.filter(part => part != null && part.tokenAddress != null), encodedItem.tokenAddress, encodedItem.tokenId));
  
  if (true) {
	  if (selectedOwned === true) {
	  	//encodedItems = encodedItems.filter(encodedItem => filterTokenItem(holdings, encodedItem.tokenAddress, encodedItem.tokenId));
	  }
  }
  
  const mergedHoldings = holdings.concat(previousChildTokens);
  
  const saveEnabled = (nounTokenAddress !== undefined && nounTokenId !== undefined && composerProxyAddress !== undefined) && (hasOwnedComposedItems) && (hasDifferentComposedItems);

  const onRemoveItemClick = (index: number) => {
	var items: ComposableItem[] = [];
	
	const tempItems: ComposableItem[] = [...stateItems];
	const rItems = tempItems.slice().reverse();
	
	rItems[index] = items[0];	
	
  	setStateItems(rItems.slice().reverse());
  }
  
  const onDragEndSimple = (results: any) => {
  	const { source, destination, combine } = results;
  	
  	const tempItems: ComposableItem[] = [...stateItems];
  	
  	//if drop into combined
  	if (combine) {
  		const items = reorder(
  			tempItems.slice().reverse(),
  			source.index,
  			combine.draggableId
  		);
  		
  		setStateItems(items.slice().reverse());  		
  	}
  	
  	//regular drop flow
  	
  	// dropped outside the list
  	if (!destination) {
  		return;
  	}
  	
  	
  	if (source.droppableId === destination.droppableId) {
  		const items = reorder(
  			tempItems.slice().reverse(),
  			source.index,
  			destination.index
  		);
  		
  		setStateItems(items.slice().reverse());
  	}
  };
    
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
              <Trans>Explore</Trans>
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
						      <DragDropContext onDragEnd={(results: any) => {onDragEndSimple(results);}}>
						
								<DroppableControlNew droppableId="Foreground" droppableItems={composedItems} holdings={mergedHoldings} itemLimit={16} palette={getImageData(nounExtensionName).palette} onRemoveItemClick={onRemoveItemClick} />
						
						      </DragDropContext>

						</Col>
					</Row>

					<Row style={{marginBottom: 25, display: 'none', visibility: 'hidden'}} >
						<Col lg={12} xs={12}>
							<strong>Layers</strong>
							<DroppableControl droppableId="Foreground" droppableItems={getList('Foreground')} holdings={mergedHoldings} itemLimit={10} />
						</Col>
					</Row>
		
					<Row style={{marginBottom: 25, display: 'none', visibility: 'hidden'}} >
						<Col lg={12} xs={12}>
							<strong>Foreground</strong>
							<DroppableControl droppableId="Foreground" droppableItems={getList('Foreground')} holdings={mergedHoldings} itemLimit={4} />
						</Col>
					</Row>
					<Row style={{marginBottom: 25, display: 'none', visibility: 'hidden'}}>
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
					<Row style={{marginBottom: 25, display: 'none', visibility: 'hidden'}}>
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
      			label="Only show items I own" />
      		</Col>

	  	  	<Col lg={12}>	    	
				<DroppableControl droppableId="Items" droppableItems={encodedItems} holdings={mergedHoldings} itemLimit={1000} onItemClick={onItemClick} />          					
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
        			<TooltipInfo tooltipText={"You can only save your changes on-chain when you are the owner of the Noun AND the custom traits you're trying to compose inside of it."} />
	         	</Col>
	        </Row>
		)}
		</Row>		
		<Row className="composer-uploader">
        {nounSVG && (
        	<Row>
	          	  <Col lg={12}>					
					<hr style={{ marginBottom: 0 }} />

	          	  	<span>
	          	  	You can also upload your own art into the Composer to experiment with adding new custom traits. 
	          	  	<br /><br />
	          	  	When you're ready, you can then mint and sell your creations on the Collection pages. <a href="/collections/" style={{ textDecoration: 'none', fontWeight: 'bold'}}>Learn more →</a>
	          	  	</span>

	          	  </Col>
	
	          	  <Col lg={3}>	
		            <label style={{ margin: '1rem 0 .25rem 0' }} htmlFor="custom-trait-upload">
		              <Trans>Upload Custom Trait</Trans>
		              <TooltipInfo tooltipText={"Only 32x32 PNG images are accepted."} />
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
					&nbsp;
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
