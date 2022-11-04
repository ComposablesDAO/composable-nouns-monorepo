import classes from './ComposableItemCollectionRow.module.css';
import { Row, Col, Button, Card, Spinner } from 'react-bootstrap';

import { ComposableItemCards } from '../ComposableItemCard';

import { ComposableItemCollection, ComposableItem, ComposablesMarketListing, filterComposableItemByAddress } from '../../utils/composables/composablesWrapper';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export const ComposableItemCollectionRows: React.FC<{collections: ComposableItemCollection[] | undefined, collectionItems: ComposableItem[] | undefined, listings?: ComposablesMarketListing[]  }> = props => {
  const { collections, collectionItems, listings } = props;  

  return (
    <Row className={classes.collectionRows}>
    	{collections === undefined ? (
			<div className={classes.spinner}>
				<Spinner animation="border" />
			</div>
        ) : (
			collections.map(collection => (
		        <Row className={classes.collectionRow}>
		          <ComposableItemCollectionRow collection={collection} composableItems={filterComposableItemByAddress(collectionItems, collection.tokenAddress)} listings={listings} />
		        </Row>
			))
        )}
    </Row>
  );
};


export const ComposableItemCollectionRow: React.FC<{
  collection: ComposableItemCollection;
  composableItems: ComposableItem[] | undefined,
  listings?: ComposablesMarketListing[]
}> = props => {
  const { collection, composableItems, listings } = props;
  
  const collectionAddress = collection.tokenAddress;  

  if (!collection) {
  	return <></>;
  }
    
  const name = collection.name;
  const creatorName = collection.owner;
  
  const latestItems = (composableItems) ? composableItems.slice().reverse().slice(0, 5) : composableItems;

  return (
    <>
      <Col xs={6} md={6} lg={6} className={classes.collectionRowInfo}>
	      <Card.Title className={classes.cardTitle}>
	        {name}
	      </Card.Title>
	      <Card.Text style={{ paddingTop: '0rem' }}>
	      	<span style={{ color: 'gray' }}><FontAwesomeIcon icon={faUser} /> {creatorName}</span>
	      	<br />
	      </Card.Text>
		  <a href={`/collection/${collectionAddress}`}>
	      	<Button className={classes.primaryBtnCollection}>View</Button>
	      </a>      
      </Col>
      <Col xs={6} md={6} lg={6} className={classes.collectionRowItems}>
      	<strong>Latest Items:</strong>
      	<Row>
	    	{latestItems === undefined ? (
				<div className={classes.spinner}>
					<Spinner animation="border" />
				</div>
	        ) : (      	
				<ComposableItemCards composableItems={latestItems} listings={listings} onlyThumbnail={true} />
	        )}
        </Row>
      </Col>	      
    </>
  );
};

