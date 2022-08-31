//import React from 'react';
import React, { useEffect, useState } from 'react';
import classes from './Composer.module.css';
import {
  Container,
  Col,
  Row
} from 'react-bootstrap';

import Noun from '../../components/Noun';
import Link from '../../components/Link';
import { ImageData, getNounData, getRandomNounSeed } from '@nouns/assets';
import { DecodedImage } from '@nouns/sdk';
import { INounSeed } from '../../wrappers/nounToken';
import { default as ComposablesImageData } from '../../libs/image-data/image-data-composables.json';


import { Trans } from '@lingui/macro';

// @ts-ignore
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const decodeImage = (image: string): DecodedImage => {
  const data = image.replace(/^0x/, '');
  const paletteIndex = parseInt(data.substring(0, 2), 16);
  const bounds = {
    top: parseInt(data.substring(2, 4), 16),
    right: parseInt(data.substring(4, 6), 16),
    bottom: parseInt(data.substring(6, 8), 16),
    left: parseInt(data.substring(8, 10), 16),
  };
  const rects = data.substring(10);

  return {
    paletteIndex,
    bounds,
    rects:
      rects
        ?.match(/.{1,4}/g)
        ?.map(rect => [parseInt(rect.substring(0, 2), 16), parseInt(rect.substring(2, 4), 16)]) ??
      [],
  };
};

const getRectLength = (currentX: number, drawLength: number, rightBound: number): number => {
  const remainingPixelsInLine = rightBound - currentX;
  return drawLength <= remainingPixelsInLine ? drawLength : remainingPixelsInLine;
};

const buildSVG = (
  parts: { data: string, palette?: string[] }[],
  paletteColors: string[],
  bgColor: string,
): string => {
  const svgWithoutEndTag = parts.reduce((result, part) => {
    const svgRects: string[] = [];

    const { bounds, rects } = decodeImage(part.data);
    
    const localPalette = (part.palette) ? (part.palette) :  null;
    
    let currentX = bounds.left;
    let currentY = bounds.top;

    rects.forEach(draw => {
      let [drawLength, colorIndex] = draw;
      const hexColor = (localPalette) ? localPalette[colorIndex] : paletteColors[colorIndex];

      let length = getRectLength(currentX, drawLength, bounds.right);
      while (length > 0) {
        // Do not push rect if transparent
        if (colorIndex !== 0) {
          svgRects.push(
            `<rect width="${length * 10}" height="10" x="${currentX * 10}" y="${
              currentY * 10
            }" fill="#${hexColor}" />`,
          );
        }

        currentX += length;
        if (currentX === bounds.right) {
          currentX = bounds.left;
          currentY++;
        }

        drawLength -= length;
        length = getRectLength(currentX, drawLength, bounds.right);
      }
    });
    result += svgRects.join('');
    return result;
  }, `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#${bgColor}" />`);

  return `${svgWithoutEndTag}</svg>`;
};

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
  justifyContent: styleJustify,
  borderRadius: '16px',
});

const shortName = (name: string) => {
  if (name.length < 21) {
    return name;
  }
  return [name.substr(0, 7), name.substr(name.length - 11, 11)].join('...');
};

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
  palette: string[];
}  	

interface DroppableItemSet {
  id: string;
  items: DroppableItem[];
}

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

const ComposerPage = () => {

  const [stateItemsArray, setStateItemsArray] = useState<DroppableItemSet[]>([]);

  const [seed, setSeed] = useState<INounSeed>();
  const [nounSVG, setNounSVG] = useState<string>();
    
  const [initLoad, setInitLoad] = useState<boolean>(true);

  useEffect(() => {
    if (initLoad) {
	  	const seed = getRandomNounSeed();
	  	setSeed(seed);
	
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
  	//const seed = getRandomNounSeed();
  	if (!seed) {
  		return;
  	}
  	const { parts, background } = getNounData(seed);
  	  		
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
	
	const svg = buildSVG(partsComposed.filter(part => part != null), ImageData.palette, background);
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
  
  return (
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
            <p style={{ fontStyle: 'italic', fontSize: 'small' }}>
            	Note: During this demo, the Noun presented is randomly generated. The traits in your Inventory are pulled from the recent Noundry competition.
			</p>
          </Col>
        </Row>
		<DragDropContext onDragEnd={(result: any) => {onDragEnd(result);}}>
        	<Row>
	          <Col lg={6}>
				{nounSVG && (
					<Noun
	                  imgPath={`data:image/svg+xml;base64,${btoa(nounSVG)}`}
	                  alt="Noun"
	                  className={classes.nounImg}
	                  wrapperClassName={classes.nounWrapper}
	                />				
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
        	</Row>
		</DragDropContext>
      </Container>
  );
};

export default ComposerPage;
