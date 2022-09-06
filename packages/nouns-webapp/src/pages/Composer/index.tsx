//import React from 'react';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import classes from './Composer.module.css';
import {
  Container,
  Col,
  Button,
  Image,
  Row,
  Form,
  OverlayTrigger,
  Popover,
} from 'react-bootstrap';

import Noun from '../../components/Noun';
import Link from '../../components/Link';
import { ImageData } from '@nouns/assets';
import { EncodedImage, PNGCollectionEncoder } from '@nouns/sdk';
import { buildSVG } from '../../utils/composables/nounsSDK';
import { getNounData, getRandomNounSeed } from '../../utils/composables/nounsAssets';

import { INounSeed } from '../../wrappers/nounToken';
import { default as ComposablesImageData } from '../../libs/image-data/image-data-composables.json';
import InfoIcon from '../../assets/icons/Info.svg';
import { PNG } from 'pngjs';
import NounModal from './NounModal';
import NounPicker from './NounPicker';

import config from '../../config';

import { Trans } from '@lingui/macro';

// @ts-ignore
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ShepherdTour, ShepherdOptionsWithType } from 'react-shepherd'
import 'shepherd.js/dist/css/shepherd.css';

/* start drag and drop */

// a little function to help us with reordering the result
const reorder = (list: DroppableItem[], startIndex: any, endIndex: any) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const move = (source: DroppableItem[], destination: DroppableItem[], droppableSource: any, droppableDestination: any) => {
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

const DroppableControl: React.FC<{ droppableId: string; droppableItems: DroppableItem[]; itemLimit: number; }> = props => {
  const { droppableId, droppableItems, itemLimit } = props;
  
  const styleJustify = (itemLimit === 1) ? 'center' : 'left';
  const styleOverflow = (itemLimit === 1) ? 'visible' : 'auto';
  const direction = (itemLimit > 10) ? 'vertical' : 'horizontal';
  const isDropDisabled = (droppableItems.length === itemLimit) ? true : false;
    
  return (
    <>
    <strong>{droppableId}</strong>
    <Droppable droppableId={droppableId} direction={direction} isDropDisabled={isDropDisabled}>
        {(provided: any, snapshot: any) => (
            <div
                ref={provided.innerRef}
                className={classes.dropList}
                style={getListStyle(snapshot.isDraggingOver, styleJustify, styleOverflow)}>
                {droppableItems.map((item, index) => (
                    <Draggable
                        key={item.id}
                        draggableId={item.id}
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
				                  imgPath={`data:image/svg+xml;base64,${btoa(item.svg)}`}
				                  alt="Noun"
				                  className={classes.nounImgDrag}
				                  wrapperClassName={classes.nounWrapperDrag}
				                />		                                            
				                <p style={{textAlign: 'center', margin: 0, padding: 0}}>{shortName(item.content)}</p>
                            </div>
                        )}
                    </Draggable>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
    </>
  );
};

interface DroppableItem {
  filename: string;
  data: string;
  svg: string;
  id: string;
  content: string;
  palette: string[] | null;
}  	

interface DroppableItemSet {
  id: string;
  items: DroppableItem[];
}

/* end drag and drop */


const shortName = (name: string) => {
  if (name.length < 21) {
    return name;
  }
  return [name.substr(0, 7), name.substr(name.length - 11, 11)].join('...');
};

const composableDocLink = (
  <Link
    text="Composable Nouns Framework"
    url="https://hackmd.io/@jhernanx/B1AoPVcR5"
    leavesPage={true}
  />
);

const nounsDiscordLink = (
  <Link
    text="Nouns Discord"
    url="http://discord.gg/nouns"
    leavesPage={true}
  />
);

interface PendingCustomTrait {
  type: string;
  data: string;
  filename: string;
}

const DEFAULT_TRAIT_TYPE = 'heads';

//TODO: remove encoder dependency on singular image data, have each uploaded item stand on its own
let encoder = new PNGCollectionEncoder(ImageData.palette);

const ComposerPage = () => {

  const [stateItemsArray, setStateItemsArray] = useState<DroppableItemSet[]>([]);
  const [nounExtensionName, setNounExtensionName] = useState<string>('Nouns');    
  const [nounExtensions, setNounExtensions] = useState<any[]>([]);

  const [seed, setSeed] = useState<INounSeed>();
  const [nounSVG, setNounSVG] = useState<string>();    
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [initLoadTour, setInitLoadTour] = useState<boolean>(true);
  const [displayNoun, setDisplayNoun] = useState<boolean>(false);
  const [displayNounPicker, setDisplayNounPicker] = useState<boolean>(false);

  const [pendingTrait, setPendingTrait] = useState<PendingCustomTrait>();
  const [isPendingTraitValid, setPendingTraitValid] = useState<boolean>();

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
  	const seed = getRandomNounSeed(getImageData(nounExtensionName));
  	setNounExtensionName('Nouns');
	setSeed(seed);
  };

  useEffect(() => {
    if (initLoad) {

	    const loadExtensions = async () => {

		  const extensions = config.composables.extensions;		  
		  for (const extension of extensions) {
			    const response = await fetch(extension.imageDataUri);
			    const data = await response.json();			    
			    extension.imageData = data;
		  }		  
		  
		  setNounExtensions(extensions);
		  console.log('Loading up fetched extension image data');
	    };

	    setNounExtensions(config.composables.extensions);
	    loadExtensions();
    	
		const dragItems: DroppableItem[] = [];
		ComposablesImageData.images.composables.forEach(({filename, data}) => {		
			//const tempItem = new ComposableDragItem({filename, data});
			const part = {
		        "filename": filename,
		        "data": data,
		     };
		     const parts = [ part ];
		     const svg = buildSVG(parts, ComposablesImageData.palette, 'fff');
			
			dragItems.push({filename, data, svg, id: filename, content: filename, palette: ComposablesImageData.palette});
		});
				
	    setStateItemsArray((stateItemsArray) => [
	        ...stateItemsArray,
	        {
	            id: "Inventory",
	            items: dragItems
	        },
	    ]);
	    
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
  }, [/*generateNounSvg,*/ initLoad]);

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
	
	const svg = buildSVG(partsComposed.filter(part => part != null), imageData.palette, background);
	setNounSVG(svg);
	
  	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/*generateNounSvg,*/ seed, stateItemsArray]);

  const getList = (listId: string) => {
  	var items: DroppableItem[] = [];
  	
	stateItemsArray.forEach(droppableItem => {
	    if (droppableItem.id === listId) {
	    	items = droppableItem.items;
	    }
	});  	
  	
  	return items;
  }
    
  const onDragEnd = (result: any) => {
        const { source, destination } = result;

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
            const result = move(
                getList(source.droppableId),
                getList(destination.droppableId),
                source,
                destination
            );
			
            const tempItems = stateItemsArray.map((droppables) =>
                droppables.id === source.droppableId
                    ? { ...droppables, items: result.source }
                    : { ...droppables }
           	);

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
    const { type, data, filename } = pendingTrait || {};
    if (type && data && filename) {
      const imageData = getImageData(nounExtensionName);
      const images = imageData.images as Record<string, EncodedImage[]>;
      images[type].push({
        filename,
        data,
      });
      
      const droppableId = 'Inventory';
      const items = getList(droppableId);

      const part = {
        "filename": filename,
        "data": data,
      };
      const parts = [ part ];
      const svg = buildSVG(parts, encoder.data.palette, 'fff');      
      
      items.unshift({filename, data, svg, id: filename, content: filename, palette: null});

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


const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    }
  },
  useModalOverlay: true
};

function TourButton() {
  //const tour = useContext(ShepherdTourContext);
  
  if (initLoadTour) {
	  //tour!.start();
	  setInitLoadTour(false);
  }
  
  return null;
  /*
  return (
    <button className="button dark" onClick={tour!.start}>
      Start Tour
    </button>
  );
  */
}

const steps: ShepherdOptionsWithType[] = [
  {
    id: 'intro',
    attachTo: { element: '.hero-welcome', on: 'bottom' },
    /*
    beforeShowPromise: function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          window.scrollTo(0, 0);
          resolve();
        }, 500);
      });
    },
    */
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Exit',
        type: 'cancel'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Back',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Next',
        type: 'next'
      }
    ],
    classes: 'custom-class-name-1 custom-class-name-2',
    highlightClass: 'highlight',
    scrollTo: true,
    cancelIcon: {
      enabled: true,
    },
    title: 'Pick your Noun from your wallet',
    text: ['First, pick your Noun that supports composability from your wallet.'],
    when: {
      show: () => {
        console.log('show step');
      },
      hide: () => {
        console.log('hide step');
      }
    }
  },
];
  
  return (
    <>
      {displayNoun && nounSVG && (
        <NounModal
          onDismiss={() => {
            setDisplayNoun(false);
          }}
          svg={nounSVG}
        />
      )}
      {displayNounPicker && (
        <NounPicker
          onSelect={(extensionName: string | undefined, seed: INounSeed | undefined) => {
          	//check if none selected, then just close modal
          	if (extensionName !== undefined && seed !== undefined) {
	          	setNounExtensionName(extensionName);
	          	setSeed(seed);
	        }
          	
            setDisplayNounPicker(false);
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
            	More than just a Playground, the Composer allows you to take your Noun on-chain and add on top of it with different traits and layer options.
                Try out different combinations and when you're ready, you'll be able to commit your changes on-chain. 
			</p>
            <p>
                How does this happen? It's magic!
                No, it's actually just the {composableDocLink}. The framework allows you upgrade your Noun on-chain in exciting new ways! 
                You can add unique visual layers to enhance your Noun's appearance, 
                dynamically update the on-chain metadata for use in games and other websites, 
                and a whole lot more with Composable Nouns.
            </p>
            <p>
                Interested in learning more and being one of the first to play with Composable Nouns live? 
                Let us know in the {nounsDiscordLink}!
            </p>
            <p>
                Are you a Noundry artist or an extension creator? We'd love to add your creations to the Composables marketplace!
            </p>

        <ShepherdTour steps={steps} tourOptions={tourOptions}>
          <TourButton />
        </ShepherdTour>

            <Button onClick={() => setDisplayNounPicker(true)} className={classes.primaryBtn} style={{ maxWidth: '200px' }}>
              Select Noun
            </Button>			
			&nbsp;&nbsp;&nbsp;
            <Button onClick={() => generateRandomSeed()} className={classes.primaryBtn} style={{ maxWidth: '200px' }}>
              Random Noun
            </Button>			
        			
          </Col>
        </Row>

        {nounSVG && (
			<DragDropContext onDragEnd={(result: any) => {onDragEnd(result);}}>
	        	<Row>
		          <Col lg={6} className="hero-welcome">
					{nounSVG && (
	                  <div
	                    onClick={() => {
	                      setDisplayNoun(true);
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
		          <Col lg={6}>
		
						<Row style={{marginBottom: 25}}>
							<Col lg={12}>
								<DroppableControl droppableId="Foreground" droppableItems={getList('Foreground')} itemLimit={4} />
							</Col>
						</Row>
						<Row style={{marginBottom: 25}}>
							<Col lg={3}>
								<DroppableControl droppableId="Body" droppableItems={getList('Body')} itemLimit={1} />
							</Col>
							<Col lg={3}>
								<DroppableControl droppableId="Accessory" droppableItems={getList('Accessory')} itemLimit={1} />
							</Col>
							<Col lg={3}>
								<DroppableControl droppableId="Head" droppableItems={getList('Head')} itemLimit={1} />
							</Col>
							<Col lg={3}>
								<DroppableControl droppableId="Glasses" droppableItems={getList('Glasses')} itemLimit={1} />
							</Col>
						</Row>
						<Row>
							<Col lg={12}>
								<DroppableControl droppableId="Background" droppableItems={getList('Background')} itemLimit={4} />
							</Col>
						</Row>
				  </Col>
	          	  <Col lg={12}>
					<DroppableControl droppableId="Inventory" droppableItems={getList('Inventory')} itemLimit={1000} />          
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
		                <Button onClick={() => uploadCustomTrait()} className={classes.primaryBtn}>
		                  <Trans>Upload</Trans>
		                </Button>
		              </>
		            )}
	
	          	  </Col>
	          	  
	        	</Row>
			</DragDropContext>
		)}
      </Container>
    </>
  );
};

export default ComposerPage;
