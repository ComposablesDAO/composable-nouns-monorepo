import { useState } from 'react';
import classes from './ComposableItemCard.module.css';
import { Col, Button, Card } from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import TruncatedAmount from '../TruncatedAmount';

import { buildSVG } from '../../utils/composables/nounsSDK';

import ComposableItemModal from '../ComposableItemModal';

import { ComposableItem, ComposablesMarketListing, filterComposableItemMarketListing } from '../../utils/composables/composablesWrapper';

interface ComposableItemCardProps {
  composableItem: ComposableItem;
  listing?: ComposablesMarketListing;
  onItemClick?: (item: ComposableItem) => void;
  buttonType?: string;
  onButtonClick?: (item: ComposableItem) => void;
  
  onlyThumbnail?: boolean;
}

export const ComposableItemCard: React.FC<ComposableItemCardProps> = props => {
  const { composableItem, listing, onItemClick, buttonType, onButtonClick, onlyThumbnail } = props;
  
  const filename = composableItem.image.filename;
  const data = composableItem.image.data;
  const palette = composableItem.image.palette;
  
  const part = {
  	"filename": filename,
	"data": data,
  };
  const parts = [ part ];
  const svg = buildSVG(parts, palette, 'fff');
  
  const collectionName = composableItem.collection;
  const creatorName = composableItem.meta.creator;
  const categoryName = composableItem.meta.category;
  const itemName = composableItem.meta.name;
    
  let buttonText = '';
  if (buttonType === "Listing") {
  	buttonText = (listing) ? "Edit Listing" : "Add Listing";
  }

  return (
    <>
      <div onClick={() => { if (onItemClick) onItemClick(composableItem) }} >
	      <Card.Img variant="top" src={`data:image/svg+xml;base64,${btoa(svg)}`} />
	  </div>
      <Card.Title className={classes.cardTitle}>
      	{itemName}
      </Card.Title>
      {!onlyThumbnail && (
	      <Card.Text style={{ paddingTop: '0rem', fontSize: 'small' }}>	       
	      	<span style={{ fontStyle: 'italic' }}>{categoryName}</span>
	      	<br />	      	
	      	<span style={{ }}>{collectionName}</span>
	      	<br />
	      	<span style={{ color: 'gray' }}><FontAwesomeIcon icon={faUser} /> {creatorName}</span>
	      	{listing && (
	      		<>
	      		<br />
		      	<TruncatedAmount amount={listing.price} />
		      	</>
		    )}
		    {buttonType && onButtonClick && (
	      		<>
		    	<br />
		    	<Button 
		    		onClick={() => { onButtonClick(composableItem) }}
		    		className={classes.primaryBtnItem}>{buttonText}</Button>
		      	</>
		    )}		    
	      </Card.Text>
	  )}
    </>
  );
};

interface ComposableItemCardsProps {
  composableItems: ComposableItem[];
  listings?: ComposablesMarketListing[];
  
  buttonType?: string;
  onButtonClick?: (item: ComposableItem) => void;

  onlyThumbnail?: boolean;
}

export const ComposableItemCards: React.FC<ComposableItemCardsProps> = props => {
  const { composableItems, listings, buttonType, onButtonClick, onlyThumbnail } = props;

  const [displayItemModal, setDisplayItemModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ComposableItem>();

  const onItemClick = (item: ComposableItem) => {
  	setSelectedItem(item);
  	setDisplayItemModal(true);
  }

  if (!composableItems) {
  	return <></>;
  }
  
  const col = (onlyThumbnail) ? 2 : 3;

  return (
    <>
      {displayItemModal && selectedItem && (
        <ComposableItemModal
          composableItem={selectedItem}
          listing={filterComposableItemMarketListing(listings!, selectedItem.tokenAddress, selectedItem.tokenId)}
          onComplete={(listingId: number | undefined) => {

          	//check if none selected, then just close modal          	
          	//if (tokenAddress !== undefined) {
          		//setRedirectTokenAddress(tokenAddress)
	        //}
          	
            setDisplayItemModal(false);
          }}
        />
      )}
      {composableItems.map(item => (
        <Col xs={col} md={col} lg={col} className={classes.itemGroup}>
          <ComposableItemCard composableItem={item} 
          listing={filterComposableItemMarketListing(listings!, item.tokenAddress, item.tokenId)}
          onItemClick={onItemClick}
          buttonType={buttonType}
          onButtonClick={onButtonClick}
          onlyThumbnail={onlyThumbnail} />
        </Col>
      ))}
    </>
  );
};
